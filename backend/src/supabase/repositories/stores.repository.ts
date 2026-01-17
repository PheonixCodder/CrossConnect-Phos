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

  async upsertCredentials(storeId: string, encryptedCredentials: any) {
    const { error } = await this.supabaseClient
      .from('store_credentials')
      .upsert({
        store_id: storeId,
        credentials: encryptedCredentials,
      });

    if (error) {
      this.logger.error('Failed to upsert credentials', error);
      throw error;
    }
  }

  async getCredentials(
    userId: string,
    orgId: string,
  ): Promise<Database['public']['Tables']['store_credentials']['Row']> {
    const { data: orgData, error: orgError } = await this.supabaseClient
      .from('organization_members')
      .select()
      .eq('user_id', userId)
      .eq('org_id', orgId);

    if (orgError) {
      throw new Error(orgError.message);
    }
    if (!orgData || orgData.length === 0) {
      throw new Error('User is not a member of this organization');
    }
    const { data: storeData, error: storeError } = await this.supabaseClient
      .from('stores')
      .select()
      .eq('org_id', orgId);
    if (storeError) {
      throw new Error(storeError.message);
    }
    if (!storeData || storeData.length === 0) {
      throw new Error(`No store found for organization: ${orgId}`);
    }

    const { data, error } = await this.supabaseClient
      .from('store_credentials')
      .select()
      .eq('store_id', storeData[0].id);

    if (error) {
      this.logger.error('Failed to fetch credentials', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`No credentials found for store: ${storeData[0].id}`);
    }
    return data[0];
  }
}
