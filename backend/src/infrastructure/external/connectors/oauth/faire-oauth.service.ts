import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
import { CryptoService } from '../../../../shared/crypto/crypto.service';

@Injectable()
export class FaireOAuthService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly http: HttpService,
    private readonly crypto: CryptoService,
  ) {}

  getAuthUrl(storeId: string): string {
    const params = new URLSearchParams({
      applicationId: process.env.FAIRE_APP_ID!,
      redirectUrl: process.env.FAIRE_REDIRECT_URI!,
      state: storeId,
    });

    const scopes = ['READ_PRODUCTS', 'READ_ORDERS', 'READ_INVENTORIES'];
    scopes.forEach((scope) => params.append('scope', scope));

    return `https://faire.com/oauth2/authorize?${params.toString()}`;
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
          // Use the keys exactly as shown in the Faire Sample Request
          application_token: process.env.FAIRE_APP_ID!,
          application_secret: process.env.FAIRE_APP_SECRET!,
          redirect_url: process.env.FAIRE_REDIRECT_URI!,
          scope: ['READ_PRODUCTS', 'READ_ORDERS', 'READ_INVENTORIES'],
          grant_type: 'AUTHORIZATION_CODE',
          authorization_code: authorizationCode,
        },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const { access_token, token_type } = tokenResponse.data;

    if (!access_token) {
      throw new Error('Faire OAuth did not return access token');
    }

    // 2. Persist credentials
    await this.supabase.from('store_credentials').upsert(
      {
        store_id: storeId,
        credentials: {
          access_token: this.crypto.encrypt(access_token),
          token_type: this.crypto.encrypt(token_type),
          scope: ['READ_PRODUCTS', 'READ_ORDERS', 'READ_INVENTORIES'],
          issued_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'store_id' },
    );

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
