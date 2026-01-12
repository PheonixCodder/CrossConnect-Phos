import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class StoresRepository {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}
  private logger = new Logger();

  async getStoreId(platform: string): Promise<string> {
    const { data, error } = await this.supabaseClient
      .from('stores')
      .select('id')
      .eq('platform', platform)
      .single();

    if (error) {
      this.logger.error(`Store not found for platform: ${platform}`, error);

      throw new Error(`Store not found for platform: ${platform}`);
    }

    return data.id;
  }
  async getStore(
    platform: string,
  ): Promise<Database['public']['Tables']['stores']['Row']> {
    const { data, error } = await this.supabaseClient
      .from('stores')
      .select('*')
      .eq('platform', platform)
      .single();

    if (error) {
      this.logger.error(`Store not found for platform: ${platform}`, error);

      throw new Error(`Store not found for platform: ${platform}`);
    }

    return data;
  }
}
