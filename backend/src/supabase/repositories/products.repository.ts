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

  async insertProducts(orders: any) {
    const { data, error } = await this.supabaseClient
      .from('products')
      .upsert(orders, {
        onConflict: 'external_product_id',
      })
      .select('*');

    return { data, error };
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
}
