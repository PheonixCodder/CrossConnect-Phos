import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class StoresRepository {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async getStoreId(platform: string): Promise<string> {
    console.log(1);
    const { data, error } = await this.supabaseClient
      .from('stores')
      .select('id')
      .eq('platform', platform)
      .single();
    console.log(2);

    if (error) {
      throw new Error(`Store not found for platform: ${platform}`);
    }

    return data.id;
  }
}
