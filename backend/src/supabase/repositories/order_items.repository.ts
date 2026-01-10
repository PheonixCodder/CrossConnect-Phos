import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class OrderItemsRepository {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async insertOrderItems(
    orderItems: Database['public']['Tables']['order_items']['Insert'][],
  ) {
    return this.supabaseClient.from('order_items').upsert(orderItems, {
      onConflict: 'order_id',
    });
  }
}
