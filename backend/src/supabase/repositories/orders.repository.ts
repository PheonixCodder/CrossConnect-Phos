import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class OrdersRepository {
  private readonly logger = new Logger(OrdersRepository.name);

  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async insertOrdersAndReturn(
    orders: Database['public']['Tables']['orders']['Insert'][],
  ) {
    const BATCH_SIZE = 300;

    let allData: Database['public']['Tables']['orders']['Insert'][] = [];
    let totalAffected = 0;

    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);

      this.logger.debug(
        `Upserting orders batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(orders.length / BATCH_SIZE)} (${batch.length} items)`,
      );

      const { data, error, count } = await this.supabaseClient
        .from('orders')
        .upsert(batch, {
          onConflict: 'external_order_id',
        })
        .select('*');

      if (error) throw error;

      allData = allData.concat(data ?? []);
      totalAffected += count ?? batch.length;
    }

    return { data: allData }; // This will contain 'id' (internal UUID) and 'external_order_id'
  }

  async syncOrdersItemsAndShipments(
    orders: Database['public']['Tables']['orders']['Insert'][],
    items: Database['public']['Tables']['order_items']['Insert'][],
    shipments: Database['public']['Tables']['fulfillments']['Insert'][],
  ) {
    return this.supabaseClient.rpc('sync_orders_items_shipments', {
      orders,
      items,
      shipments,
    });
  }
  async getByExternalOrderIds(
    storeId: string,
    externalOrderIds: string[],
  ): Promise<Database['public']['Tables']['orders']['Row'][]> {
    if (!externalOrderIds.length) return [];

    const { data, error } = await this.supabaseClient
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .in('external_order_id', externalOrderIds);

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}
