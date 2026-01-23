import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

type InventoryRow = Database['public']['Tables']['inventory']['Row'];

@Injectable()
export class InventoryRepository {
  private readonly logger = new Logger(InventoryRepository.name);

  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  // Single update (unchanged)
  async updateInventory(
    inventory: Partial<Database['public']['Tables']['inventory']['Update']>,
    sku: string,
  ) {
    const { error } = await this.supabaseClient
      .from('inventory')
      .update(inventory)
      .eq('sku', sku);

    if (error) throw error;
  }

  async updateInventoryBatch(
    inventoryBatch: Database['public']['Tables']['inventory']['Insert'][],
  ) {
    if (!inventoryBatch?.length) return { affected: 0 };

    const BATCH_SIZE = 300;
    const MAX_CONCURRENT = 6;

    let totalAffected = 0;

    this.logger.log(
      `Upserting ${inventoryBatch.length} inventory items in batches of ${BATCH_SIZE}`,
    );

    // Split into batches
    const batches: Database['public']['Tables']['inventory']['Insert'][][] = [];
    for (let i = 0; i < inventoryBatch.length; i += BATCH_SIZE) {
      batches.push(inventoryBatch.slice(i, i + BATCH_SIZE));
    }

    // Process in parallel (max 6 concurrent)
    const results = await Promise.allSettled(
      batches.map(async (batch, index) => {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const { error, count } = await this.supabaseClient
              .from('inventory')
              .upsert(batch, { onConflict: 'store_id,sku' })
              .select('id');

            if (error) throw error;

            this.logger.debug(
              `Inventory batch ${index + 1} succeeded (${batch.length} rows)`,
            );
            return count ?? batch.length;
          } catch (err) {
            if (attempt === 3) {
              this.logger.error(
                `Inventory batch ${index + 1} failed after 3 attempts`,
                err,
              );
              throw err;
            }
            const delay = 1000 * Math.pow(2, attempt - 1);
            this.logger.warn(
              `Retry attempt ${attempt}/3 after ${delay}ms for inventory batch ${index + 1}`,
            );
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }),
    );

    // Aggregate successful results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        totalAffected += result.value!;
      } else {
        this.logger.error(
          `Inventory batch ${index + 1} failed permanently`,
          result.reason,
        );
      }
    });

    return { affected: totalAffected };
  }

  async getBySkus(
    skus: string[],
    storeId: string,
  ): Promise<Record<string, InventoryRow>> {
    if (!skus.length) return {};

    const BATCH_SIZE = 150; // ← reduced even more (from 200) to test
    const batches: string[][] = [];
    for (let i = 0; i < skus.length; i += BATCH_SIZE) {
      batches.push(skus.slice(i, i + BATCH_SIZE));
    }

    const allInventory: InventoryRow[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      this.logger.debug(
        `Inventory batch ${batchIndex + 1}/${batches.length}: ${batch.length} SKUs`,
      );

      for (let attempt = 1; attempt <= 4; attempt++) {
        // increased retries
        try {
          const { data, error } = await this.supabaseClient
            .from('inventory')
            .select('*')
            .eq('store_id', storeId)
            .in('sku', batch);

          if (error) {
            throw error; // will be caught below
          }

          allInventory.push(...(data ?? []));
          break; // success → next batch
        } catch (err: any) {
          const isLastAttempt = attempt === 4;

          this.logger.error(
            `Inventory fetch failed (batch ${batchIndex + 1}, attempt ${attempt})`,
            {
              message: err.message,
              stack: err.stack,
              cause: err.cause, // ← most important! (ECONNRESET, ENOTFOUND, certificate, etc.)
              code: err.code,
              syscall: err.cause?.syscall,
              address: err.cause?.address,
              port: err.cause?.port,
              batchSkusSample: batch.slice(0, 3),
              batchSize: batch.length,
            },
          );

          if (isLastAttempt) {
            throw new Error(
              `Inventory fetch permanently failed after retries: ${err.message}`,
            );
          }

          const delay = 1500 * Math.pow(1.5, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    return allInventory.reduce(
      (acc, row) => {
        acc[row.sku] = row;
        return acc;
      },
      {} as Record<string, InventoryRow>,
    );
  }
}
