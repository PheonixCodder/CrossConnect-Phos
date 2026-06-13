import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';
import { ProductsRepositoryPort } from '../../../../domain/repositories/repository-ports';

type InventoryRow = Database['public']['Tables']['inventory']['Row'];
type ProductIdentifierField = 'sku' | 'external_product_id' | 'asin';
type ProductIdentifierRow = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'sku' | 'external_product_id' | 'asin'
>;

@Injectable()
export class ProductsRepository implements ProductsRepositoryPort {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}
  private logger = new Logger(ProductsRepository.name);

  async insertProducts(
    products: Database['public']['Tables']['products']['Insert'][],
  ): Promise<Database['public']['Tables']['products']['Row'][]> {
    if (!products?.length) return [];

    const BATCH_SIZE = 300;
    const MAX_CONCURRENT = 6;

    let allInserted: Database['public']['Tables']['products']['Row'][] = [];

    this.logger.log(
      `Inserting ${products.length} products in batches of ${BATCH_SIZE}`,
    );

    // Split into batches
    const batches: Database['public']['Tables']['products']['Insert'][][] = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      batches.push(products.slice(i, i + BATCH_SIZE));
    }

    // Process batches in parallel (max 6 at once)
    const results = await Promise.allSettled(
      batches.map(async (batch, index) => {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const { data, error } = await this.supabaseClient
              .from('products')
              .upsert(batch, {
                onConflict: 'store_id,platform,external_product_id,sku',
              })
              .select('*');

            if (error) throw error;

            this.logger.debug(
              `Products batch ${index + 1} succeeded (${batch.length} rows)`,
            );
            return data ?? [];
          } catch (err) {
            if (attempt === 3) {
              this.logger.error(
                `Products batch ${index + 1} failed after 3 attempts`,
                err,
              );
              throw err;
            }
            const delay = 1000 * Math.pow(2, attempt - 1);
            this.logger.warn(
              `Retry attempt ${attempt}/3 after ${delay}ms for batch ${index + 1}`,
            );
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }),
    );

    // Collect successful results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allInserted = allInserted.concat(result.value!);
      } else {
        this.logger.error(
          `Batch ${index + 1} failed permanently`,
          result.reason,
        );
      }
    });

    return allInserted;
  }

  async syncProductsAndInventory(
    products: Database['public']['Tables']['products']['Insert'][],
    inventory: Database['public']['Tables']['inventory']['Insert'][],
  ) {
    return this.supabaseClient.rpc('sync_products_and_inventory', {
      products,
      inventory,
    });
  }

  async getAllProductsByStore(storeId: string) {
    const { data, error } = await this.supabaseClient
      .from('products')
      .select('id, external_product_id, title, sku, asin')
      .eq('store_id', storeId);

    if (error) {
      throw new Error(
        `Failed to fetch products for store ${storeId}: ${error.message}`,
      );
    }

    return data ?? [];
  }

  async getIdsBySkus(
    storeId: string,
    skus: string[],
    platform: string,
  ): Promise<{ id: string; sku: string }[]> {
    if (!skus.length) return [];

    // Batch the SKUs to avoid URL length limits (max 100 per batch)
    const BATCH_SIZE = 100;
    const batches: string[][] = [];

    for (let i = 0; i < skus.length; i += BATCH_SIZE) {
      batches.push(skus.slice(i, i + BATCH_SIZE));
    }

    const results: { id: string; sku: string }[] = [];

    // Process batches sequentially to avoid overwhelming the database
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data, error } = await this.supabaseClient
            .from('products')
            .select('id, sku')
            .eq('store_id', storeId)
            .eq('platform', platform)
            .in('sku', batch);

          if (error) throw error;

          if (data) {
            results.push(...data);
          }

          // Add a small delay between batches to avoid rate limiting
          if (i < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          break; // Success, break out of retry loop
        } catch (err) {
          if (attempt === 3) {
            this.logger.error(
              `Failed to fetch product IDs for batch ${i + 1}/${batches.length} after 3 attempts`,
              err,
            );
            throw err;
          }

          const delay = 1000 * Math.pow(2, attempt - 1);
          this.logger.warn(
            `Retry attempt ${attempt}/3 after ${delay}ms for batch ${i + 1}/${batches.length}`,
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    this.logger.debug(
      `Fetched ${results.length} product IDs for ${skus.length} SKUs`,
    );
    return results;
  }

  async getProductIdsByIdentifiers(
    storeId: string,
    platform: string,
    identifiers: {
      skus?: string[];
      externalProductIds?: string[];
      asins?: string[];
    },
  ): Promise<Map<string, string>> {
    const productIdByIdentifier = new Map<string, string>();
    const [skuRows, externalProductRows, asinRows] = await Promise.all([
      this.getIdentifierRows(storeId, platform, 'sku', identifiers.skus ?? []),
      this.getIdentifierRows(
        storeId,
        platform,
        'external_product_id',
        identifiers.externalProductIds ?? [],
      ),
      this.getIdentifierRows(
        storeId,
        platform,
        'asin',
        identifiers.asins ?? [],
      ),
    ]);

    for (const row of [...skuRows, ...externalProductRows, ...asinRows]) {
      productIdByIdentifier.set(row.id, row.id);
      if (row.sku) productIdByIdentifier.set(row.sku, row.id);
      if (row.external_product_id) {
        productIdByIdentifier.set(row.external_product_id, row.id);
      }
      if (row.asin) productIdByIdentifier.set(row.asin, row.id);
    }

    return productIdByIdentifier;
  }

  private async getIdentifierRows(
    storeId: string,
    platform: string,
    field: ProductIdentifierField,
    identifiers: string[],
  ): Promise<ProductIdentifierRow[]> {
    const uniqueIdentifiers = [...new Set(identifiers)].filter(Boolean);
    if (!uniqueIdentifiers.length) return [];

    const BATCH_SIZE = 100;
    const results: ProductIdentifierRow[] = [];

    for (let i = 0; i < uniqueIdentifiers.length; i += BATCH_SIZE) {
      const batch = uniqueIdentifiers.slice(i, i + BATCH_SIZE);
      const { data, error } = await this.supabaseClient
        .from('products')
        .select('id, sku, external_product_id, asin')
        .eq('store_id', storeId)
        .eq('platform', platform)
        .in(field, batch);

      if (error) {
        throw new Error(
          `Failed to fetch product IDs by ${field} for store ${storeId}: ${error.message}`,
        );
      }

      results.push(...((data ?? []) as ProductIdentifierRow[]));
    }

    return results;
  }

  async updateInventoryBatch(
    inventoryBatch: Database['public']['Tables']['inventory']['Insert'][],
  ) {
    if (!inventoryBatch?.length) return { affected: 0 };

    const BATCH_SIZE = 300; // Reduced from 5000 to avoid request size limits
    const MAX_CONCURRENT = 3; // Reduced concurrency

    let totalAffected = 0;

    this.logger.log(
      `Upserting ${inventoryBatch.length} inventory items in batches of ${BATCH_SIZE}`,
    );

    // Split into batches
    const batches: Database['public']['Tables']['inventory']['Insert'][][] = [];
    for (let i = 0; i < inventoryBatch.length; i += BATCH_SIZE) {
      batches.push(inventoryBatch.slice(i, i + BATCH_SIZE));
    }

    // Process with controlled concurrency
    for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
      const concurrentBatches = batches.slice(i, i + MAX_CONCURRENT);

      const results = await Promise.allSettled(
        concurrentBatches.map(async (batch, batchIndex) => {
          for (let attempt = 1; attempt <= 5; attempt++) {
            // Increased retries
            try {
              const { error, count } = await this.supabaseClient
                .from('inventory')
                .upsert(batch, {
                  onConflict: 'store_id,sku',
                  ignoreDuplicates: false,
                })
                .select('id');

              if (error) {
                this.logger.error(
                  `Batch ${i + batchIndex + 1} Supabase error`,
                  error,
                );
                throw error;
              }

              this.logger.debug(
                `Inventory batch ${i + batchIndex + 1} succeeded (${batch.length} rows)`,
              );
              return count ?? batch.length;
            } catch (err) {
              if (attempt === 5) {
                this.logger.error(
                  `Inventory batch ${i + batchIndex + 1} failed after 5 attempts`,
                  err,
                );
                throw err;
              }
              const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
              this.logger.warn(
                `Retry attempt ${attempt}/5 after ${delay}ms for inventory batch ${i + batchIndex + 1}`,
              );
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        }),
      );

      // Aggregate successful results
      results.forEach((result, resultIndex) => {
        if (result.status === 'fulfilled') {
          totalAffected += result.value!;
        } else {
          this.logger.error(
            `Inventory batch ${i + resultIndex + 1} failed permanently`,
            result.reason,
          );
          throw result.reason; // Re-throw to fail the entire sync
        }
      });

      // Add delay between concurrent batch groups
      if (i + MAX_CONCURRENT < batches.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return { affected: totalAffected };
  }

  async getProductIdsBySkusInBatches(
    storeId: string,
    skus: string[],
    platform: string,
  ): Promise<Map<string, string>> {
    const uniqueSkus = [...new Set(skus)].filter(Boolean);
    const productIdBySku = new Map<string, string>();

    try {
      const productIdRows = await this.getIdsBySkus(
        storeId,
        uniqueSkus,
        platform,
      );

      productIdRows.forEach((row) => {
        productIdBySku.set(row.sku, row.id);
      });
    } catch (error) {
      this.logger.error('Failed to fetch product IDs for SKUs', error);
      throw error;
    }

    return productIdBySku;
  }
}
