import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

type InventoryRow = Database['public']['Tables']['inventory']['Row'];

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  // Single update (existing)
  async updateInventory(inventory: any, sku: string) {
    await this.supabaseClient
      .from('inventory')
      .update(inventory)
      .eq('sku', sku);
  }

  // New batch update method
  async updateInventoryBatch(
    inventoryBatch: Database['public']['Tables']['inventory']['Insert'][],
  ) {
    return this.supabaseClient
      .from('inventory')
      .upsert(inventoryBatch, { onConflict: 'sku' });
  }

  async getBySkus(
    skus: string[],
    storeId: string,
  ): Promise<Record<string, InventoryRow>> {
    if (!skus.length) return {};

    const { data, error } = await this.supabaseClient
      .from('inventory')
      .select('*')
      .eq('store_id', storeId)
      .in('sku', skus);

    if (error) {
      throw error;
    }

    /**
     * Normalize into O(1) lookup by SKU
     */
    return (data ?? []).reduce<Record<string, InventoryRow>>((acc, row) => {
      acc[row.sku] = row;
      return acc;
    }, {});
  }
}
