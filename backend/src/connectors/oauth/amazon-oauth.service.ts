import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { Database } from 'src/supabase/supabase.types';

@Injectable()
export class AmazonOAuthService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly http: HttpService,
  ) {}

  /**
   * Seller Central consent URL
   */
  getAuthUrl(storeId: string): string {
    const params = new URLSearchParams({
      application_id: process.env.AMAZON_APP_ID!,
      redirect_uri: process.env.AMAZON_REDIRECT_URI!,
      state: storeId,
      version: 'beta',
    });

    return `https://sellercentral.amazon.com/apps/authorize/consent?${params}`;
  }

  /**
   * Handles SP-API OAuth callback
   */
  async handleCallback(spapiCode: string, storeId: string): Promise<void> {
    if (!storeId) {
      throw new Error('Invalid OAuth state');
    }

    // 1. Exchange SP-API code → refresh token
    const tokenResponse = await firstValueFrom(
      this.http.post(
        'https://api.amazon.com/auth/o2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: spapiCode,
          client_id: process.env.AMAZON_LWA_CLIENT_ID!,
          client_secret: process.env.AMAZON_LWA_CLIENT_SECRET!,
          redirect_uri: process.env.AMAZON_REDIRECT_URI!,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      ),
    );

    const { refresh_token } = tokenResponse.data;

    if (!refresh_token) {
      throw new Error('Amazon did not return refresh_token');
    }

    // 3. Persist credentials
    await this.supabase.from('store_credentials').upsert({
      store_id: storeId,
      credentials: {
        refresh_token,
        lwa_client_id: process.env.AMAZON_LWA_CLIENT_ID!,
        lwa_client_secret: process.env.AMAZON_LWA_CLIENT_SECRET!,
      },
      updated_at: new Date().toISOString(),
    });

    // 4. Activate store
    await this.supabase
      .from('stores')
      .update({
        auth_status: 'active',
        auth_expires_at: null,
      })
      .eq('id', storeId);
  }
}
