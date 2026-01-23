import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { Database } from 'src/supabase/supabase.types';

@Injectable()
export class FaireOAuthService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly http: HttpService,
  ) {}

  getAuthUrl(storeId: string): string {
    const params = new URLSearchParams({
      applicationId: process.env.FAIRE_APP_ID!,
      redirectUrl: process.env.FAIRE_REDIRECT_URI!,
      state: storeId,
      scope: ['READ_PRODUCTS', 'READ_ORDERS', 'READ_INVENTORIES'].join(' '),
    });

    return `https://faire.com/oauth2/authorize?${params}`;
  }

  async handleCallback(
    authorizationCode: string,
    storeId: string,
  ): Promise<void> {
    // 1. Exchange code → access token
    const tokenResponse = await firstValueFrom(
      this.http.post(
        'https://www.faire.com/api/external-api-oauth2/token',
        {
          applicationId: process.env.FAIRE_APP_ID!,
          applicationSecret: process.env.FAIRE_APP_SECRET!,
          redirectUrl: process.env.FAIRE_REDIRECT_URI!,
          scope: ['READ_PRODUCTS', 'READ_ORDERS', 'READ_INVENTORIES'],
          grantType: 'AUTHORIZATION_CODE',
          authorizationCode,
        },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const { access_token, token_type } = tokenResponse.data;

    if (!access_token) {
      throw new Error('Faire OAuth did not return access token');
    }

    // 2. Persist credentials
    await this.supabase.from('store_credentials').upsert({
      store_id: storeId,
      credentials: {
        access_token,
        token_type,
        scope: ['READ_PRODUCTS', 'READ_ORDERS', 'READ_INVENTORIES'],
        issued_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    });

    // 3. Mark store active but expiring
    await this.supabase
      .from('stores')
      .update({
        auth_status: 'active',
        // Faire tokens expire → force health checks
        auth_expires_at: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days safety
        ).toISOString(),
      })
      .eq('id', storeId);
  }
}
