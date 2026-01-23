import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

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

    const BATCH_SIZE = 3000;
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
    return await this.supabaseClient
      .from('products')
      .select('id, sku')
      .eq('store_id', storeId)
      .eq('platform', platform)
      .in('sku', skus)
      .throwOnError()
      .then((res) => res.data ?? []);
  }
}
