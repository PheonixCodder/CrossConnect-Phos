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

  async getAllActiveStores(): Promise<
    Database['public']['Tables']['stores']['Row'][]
  > {
    const { data, error } = await this.supabaseClient
      .from('stores')
      .select('*')
      .eq('auth_status', 'active');

    if (error) {
      this.logger.error('Failed to fetch active stores', error);
      throw error;
    }

    return data || [];
  }

  async getStoreById(
    storeId: string,
  ): Promise<Database['public']['Tables']['stores']['Row']> {
    const { data, error } = await this.supabaseClient
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) {
      this.logger.error(`Failed to fetch store ${storeId}`, error);
      throw error;
    }

    return data;
  }

  async updateStoreHealth(
    storeId: string,
    status: 'healthy' | 'unhealthy',
    message?: string,
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .from('stores')
      .update({
        last_health_check: new Date().toISOString(),
        auth_status: status === 'healthy' ? 'active' : 'inactive',
      })
      .eq('id', storeId);

    if (error) {
      this.logger.error(`Failed to update store health for ${storeId}`, error);
    }

    // Log alert if unhealthy
    if (status === 'unhealthy') {
      await this.createAlert(
        storeId,
        'store_health_check',
        message || 'Store connection failed',
        'high',
      );
    }
  }

  private async createAlert(
    storeId: string,
    alertType: string,
    message: string,
    severity: Database['public']['Enums']['alert_severity'],
  ): Promise<void> {
    const { error } = await this.supabaseClient.from('alerts').insert({
      store_id: storeId,
      alert_type: alertType,
      message,
      severity,
      platform: (await this.getStoreById(storeId)).platform,
    });

    if (error) {
      this.logger.error('Failed to create alert', error);
    }
  }

  async getStore(
    platform: string,
  ): Promise<Database['public']['Tables']['stores']['Row']> {
    const { data, error } = await this.supabaseClient
      .from('stores')
      .select('*')
      .eq('platform', platform as Database['public']['Enums']['platform_types'])
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

  async storesAsQueued(storeIds: string[]) {
    const now = new Date().toISOString();

    return await this.supabaseClient
      .from('stores')
      .update({
        last_health_check: now,
        auth_status: 'active',
      })
      .in('id', storeIds);
  }

  async getCredentials(
    userId: string,
    orgId: string,
    platform: string,
  ): Promise<
    Database['public']['Tables']['store_credentials']['Row'] & {
      shopDomain: string;
    }
  > {
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
      .eq('org_id', orgId)
      .eq(
        'platform',
        platform as Database['public']['Enums']['platform_types'],
      );

    if (storeError) {
      throw new Error(storeError.message);
    }
    if (!storeData || storeData.length === 0) {
      throw new Error(`No store found for organization: ${orgId}`);
    }

    const { data, error } = await this.supabaseClient
      .from('store_credentials')
      .select('*')
      .eq('store_id', storeData[0].id);

    if (error) {
      this.logger.error('Failed to fetch credentials', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`No credentials found for store: ${storeData[0].id}`);
    }
    if (!storeData[0].shopDomain) {
      throw new Error(`No shopDomain found for store: ${storeData[0].id}`);
    }
    return { ...data[0], shopDomain: storeData[0].shopDomain };
  }
}
