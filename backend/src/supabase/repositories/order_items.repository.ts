import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class OrderItemsRepository {
  private readonly logger = new Logger(OrderItemsRepository.name);

  constructor(
    @InjectSupabaseClient()
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async bulkUpsertOrderItems(
    items: Database['public']['Tables']['order_items']['Insert'][],
  ): Promise<{ count: number }> {
    if (!items?.length) {
      this.logger.debug('No order items to upsert');
      return { count: 0 };
    }

    const BATCH_SIZE = 300; // 1000–3000 usually safe; start lower if timeouts persist
    let processed = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      this.logger.debug(
        `Upserting order_items batch ${Math.floor(i / BATCH_SIZE) + 1} ` +
          `(${batch.length} rows, total so far ${processed})`,
      );

      const { error, data } = await this.supabase
        .from('order_items')
        .upsert(batch, {
          onConflict: 'order_id, sku',
        })
        .select('id');

      const count = data?.length || 0;

      if (error) {
        this.logger.error('Batch upsert failed', {
          batchSize: batch.length,
          errorCode: error.code,
          errorMsg: error.message,
          hint: error.hint,
          firstFewItems: batch.slice(0, 2), // for debugging
        });
        throw error;
      }

      processed += count ?? batch.length;
    }

    this.logger.log(
      `Bulk upserted ${processed} order items (store_id + sku conflict)`,
    );
    return { count: processed };
  }
}
