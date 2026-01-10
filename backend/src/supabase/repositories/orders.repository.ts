import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async insertOrders(
    orders: Database['public']['Tables']['orders']['Insert'][],
  ) {
    return this.supabaseClient.from('orders').upsert(orders, {
      onConflict: 'external_order_id',
    });
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
}
