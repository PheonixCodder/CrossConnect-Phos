import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { Database, Json } from '../../supabase/supabase.types';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../../common/crypto.service';
import {
  ClientConfiguration,
  TikTokShopNodeApiClient,
} from '../../libs/tiktok';

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
      service_id: this.config.get('TIKTOK_SERVICE_ID')!,
      state: storeId,
    });

    const baseUrl = 'https://services.us.tiktokshop.com/open/authorize';
    return `${baseUrl}?${params.toString()}`;
  }

  async handleCallback(code: string, storeId: string) {
    const resp = await firstValueFrom(
      this.http.get('https://auth.tiktok-shops.com/api/v2/token/get', {
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
      open_id,
      seller_name,
    } = resp.data.data;

    await this.getAuthorizedShops(access_token as string, storeId);

    // Enterprise strategy: store distinct fields for query performance
    await this.supabase.from('store_credentials').upsert({
      store_id: storeId,
      credentials: {
        access_token: this.crypto.encrypt(access_token),
        refresh_token: this.crypto.encrypt(refresh_token),
        open_id: this.crypto.encrypt(open_id),
        seller_name: this.crypto.encrypt(seller_name),
        expires_at: Date.now() + access_token_expire_in * 1000,
      },
      updated_at: new Date().toISOString(),
    });

    await this.supabase
      .from('stores')
      .update({
        shopDomain: open_id,
        auth_expires_at: new Date(
          Date.now() + access_token_expire_in * 1000,
        ).toISOString(),
      })
      .eq('id', storeId);
  }

  private async getAuthorizedShops(accessToken: string, storeId: string) {
    ClientConfiguration.globalConfig.app_key =
      this.config.get('TIKTOK_APP_KEY');
    ClientConfiguration.globalConfig.app_secret =
      this.config.get('TIKTOK_APP_SECRET');

    const tiktok = new TikTokShopNodeApiClient({
      config: ClientConfiguration.createConfig().build(),
    });

    const shops = await tiktok.api.AuthorizationV202309Api.ShopsGet(
      accessToken,
      'application/json',
    );
    await this.supabase
      .from('stores')
      .update({
        stores: { shops: shops.body.data?.shops as unknown as Json },
      })
      .eq('id', storeId);
  }

  async getValidToken(
    storeId: string,
  ): Promise<{ accessToken: string; shop_cipher: string }> {
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
        creds.shop_cipher as string,
      );
    }
    // Inside getValidToken
    const cipher = (creds.shop_cipher as string) ?? null;

    if (!cipher) {
      throw new BadRequestException(
        'Store not activated. Please select a shop from the dashboard.',
      );
    }

    return {
      accessToken: this.crypto.decrypt(creds.access_token),
      shop_cipher: cipher,
    };
  }

  private async refreshToken(
    storeId: string,
    refreshToken: string,
    shop_cipher: string,
  ): Promise<{ accessToken: string; shop_cipher: string }> {
    const resp = await firstValueFrom(
      this.http.get('https://auth.tiktok-shops.com/api/v2/token/refresh', {
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
      open_id,
    } = resp.data.data;
    const expiresAt = Date.now() + access_token_expire_in * 1000;

    await this.supabase
      .from('store_credentials')
      .update({
        credentials: {
          access_token: this.crypto.encrypt(access_token),
          refresh_token: this.crypto.encrypt(new_refresh),
          open_id: this.crypto.encrypt(open_id),
          shop_cipher: shop_cipher,
          expires_at: expiresAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId);

    return { accessToken: access_token, shop_cipher };
  }
}
