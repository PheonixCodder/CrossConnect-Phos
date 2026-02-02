import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { Database } from '../../supabase/supabase.types';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../../common/crypto.service';

@Injectable()
export class TikTokOAuthService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
  ) {}

  getAuthUrl(storeId: string) {
    const params = new URLSearchParams({
      app_key: this.config.get('TIKTOK_APP_KEY')!,
      redirect_uri: this.config.get('TIKTOK_REDIRECT_URI')!,
      state: storeId,
      response_type: 'code',
    });
    return `https://auth.tiktok-shops.com/oauth/authorize?${params}`;
  }

  async handleCallback(code: string, storeId: string) {
    const resp = await firstValueFrom(
      this.http.get('https://auth.tiktok-shops.com', {
        params: {
          app_key: this.config.get('TIKTOK_APP_KEY'),
          app_secret: this.config.get('TIKTOK_APP_SECRET'),
          auth_code: code,
          grant_type: 'authorized_code',
        },
      }),
    );

    const {
      access_token,
      refresh_token,
      access_token_expire_in,
      shop_cipher,
      shop_id,
    } = resp.data.data;

    // Enterprise strategy: store distinct fields for query performance
    await this.supabase.from('store_credentials').upsert({
      store_id: storeId,
      credentials: {
        access_token: this.crypto.encrypt(access_token),
        refresh_token: this.crypto.encrypt(refresh_token),
        shop_cipher: this.crypto.encrypt(shop_cipher),
        shop_id: this.crypto.encrypt(shop_id),
        expires_at: Date.now() + access_token_expire_in * 1000,
      },
      updated_at: new Date().toISOString(),
    });

    await this.supabase
      .from('stores')
      .update({
        auth_status: 'active',
        shopDomain: shop_id,
        auth_expires_at: new Date(
          Date.now() + access_token_expire_in * 1000,
        ).toISOString(),
      })
      .eq('id', storeId);
  }

  async getValidToken(
    storeId: string,
  ): Promise<{ accessToken: string; shopCipher: string }> {
    const { data: credRecord, error } = await this.supabase
      .from('store_credentials')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error || !credRecord)
      throw new UnauthorizedException('TikTok not connected');

    const creds = credRecord.credentials as any;
    const isExpiring = creds.expires_at - Date.now() < 300000; // 5 mins buffer

    if (isExpiring) {
      return this.refreshToken(
        storeId,
        this.crypto.decrypt(creds.refresh_token) as string,
      );
    }

    return { shopCipher: creds.shop_cipher, accessToken: creds.access_token };
  }

  private async refreshToken(
    storeId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; shopCipher: string }> {
    const resp = await firstValueFrom(
      this.http.get('https://auth.tiktok-shops.com', {
        params: {
          app_key: this.config.get('TIKTOK_APP_KEY'),
          app_secret: this.config.get('TIKTOK_APP_SECRET'),
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
      }),
    );

    const {
      access_token,
      refresh_token: new_refresh,
      access_token_expire_in,
      shop_cipher,
      shop_id,
    } = resp.data.data;
    const expiresAt = Date.now() + access_token_expire_in * 1000;

    await this.supabase
      .from('store_credentials')
      .update({
        credentials: {
          access_token: this.crypto.encrypt(access_token),
          refresh_token: this.crypto.encrypt(new_refresh),
          shop_cipher: this.crypto.encrypt(shop_cipher),
          shop_id: this.crypto.encrypt(shop_id),
          expires_at: expiresAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId);

    return { shopCipher: shop_cipher, accessToken: access_token };
  }
}
