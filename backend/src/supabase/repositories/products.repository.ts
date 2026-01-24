import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

type InventoryRow = Database['public']['Tables']['inventory']['Row'];

@Injectable()
export class ProductsRepository {
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
                onConflict: 'store_id,external_product_id',
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
      .select('id, external_product_id, title, sku')
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
    const BATCH_SIZE = 500; // Process 500 SKUs at a time

    const productIdBySku = new Map<string, string>();

    for (let i = 0; i < skus.length; i += BATCH_SIZE) {
      const batch = skus.slice(i, i + BATCH_SIZE);

      try {
        const productIdRows = await this.getIdsBySkus(storeId, batch, platform);

        productIdRows.forEach((row) => {
          productIdBySku.set(row.sku, row.id);
        });

        this.logger.debug(
          `Processed SKU batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(skus.length / BATCH_SIZE)}`,
        );

        // Add a small delay between batches
        if (i + BATCH_SIZE < skus.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch product IDs for SKU batch starting at index ${i}`,
          error,
        );
        throw error;
      }
    }

    return productIdBySku;
  }
}
