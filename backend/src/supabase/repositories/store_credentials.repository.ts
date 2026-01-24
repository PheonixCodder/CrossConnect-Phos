import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';
import { CryptoService } from '../../common/crypto.service';

@Injectable()
export class StoreCredentialsService {
  private readonly logger = new Logger(StoreCredentialsService.name);

  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
    private readonly cryptoService: CryptoService,
  ) {}

  async getActiveStoresWithCredentials(): Promise<
    Array<{
      store: Database['public']['Tables']['stores']['Row'];
      credentials: Database['public']['Tables']['store_credentials']['Row']['credentials'];
    }>
  > {
    try {
      // Get all active stores with their credentials
      const { data, error } = await this.supabaseClient
        .from('stores')
        .select(
          `
          *,
          store_credentials(credentials)
        `,
        )
        .eq('auth_status', 'active');

      if (error) {
        this.logger.error('Failed to fetch active stores', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Decrypt credentials and return combined data
      return data
        .filter(
          (store) =>
            store.store_credentials && store.store_credentials.length > 0,
        )
        .map((store) => {
          try {
            const encryptedCredentials = store.store_credentials[0].credentials;
            const credentials = encryptedCredentials;

            return {
              store,
              credentials,
            };
          } catch (err) {
            this.logger.error(
              `Failed to decrypt credentials for store ${store.id}`,
              err,
            );
            return null;
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    } catch (error) {
      this.logger.error('Error fetching active stores with credentials', error);
      throw error;
    }
  }

  async getCredentialsByStoreId(storeId: string): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('store_credentials')
      .select('credentials')
      .eq('store_id', storeId)
      .single();

    if (error) {
      throw new Error(
        `Failed to fetch credentials for store ${storeId}: ${error.message}`,
      );
    }

    return data.credentials;
  }

  async updateCredentials(storeId: string, credentials: any): Promise<void> {
    const encryptedCredentials = this.cryptoService.encrypt(credentials);

    const { error } = await this.supabaseClient
      .from('store_credentials')
      .upsert({
        store_id: storeId,
        credentials: encryptedCredentials,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to update credentials: ${error.message}`);
    }

    // Update store's last_health_check
    await this.supabaseClient
      .from('stores')
      .update({
        last_health_check: new Date().toISOString(),
      })
      .eq('id', storeId);
  }
}
