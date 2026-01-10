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
    const { data, error } = await this.supabaseClient
      .from('products')
      .upsert(products, {
        onConflict: 'external_product_id',
      })
      .select('*'); // return all columns including internal 'id'

    if (error) {
      throw new Error(`Failed to insert products: ${error.message}`);
    }

    return data ?? [];
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
