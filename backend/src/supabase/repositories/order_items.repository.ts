import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class OrderItemsRepository {
  logger = new Logger();
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}
  async bulkUpsertOrderItems(
    orderItems: Database['public']['Tables']['order_items']['Insert'][],
  ) {
    if (!orderItems?.length) {
      this.logger.debug('No order items to bulk upsert');
      return { count: 0 };
    }

    this.logger.log(`Bulk upserting ${orderItems.length} order items via RPC`);

    const { error } = await this.supabaseClient.rpc('bulk_upsert_order_items', {
      items: orderItems, // ← send the full array directly
    });

    if (error) {
      this.logger.error('Bulk upsert RPC failed', {
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details,
        itemCount: orderItems.length,
      });
      throw error;
    }

    this.logger.log(
      `Bulk upsert via RPC completed successfully (${orderItems.length} items)`,
    );

    return { count: orderItems.length };
  }
}
