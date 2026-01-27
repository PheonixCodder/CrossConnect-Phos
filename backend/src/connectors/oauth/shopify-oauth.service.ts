import { Injectable, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../supabase/supabase.types';

@Injectable()
export class ShopifyOAuthService {
  private readonly scopes = [
    'read_products',
    'read_inventory',
    'read_orders',
    'read_fulfillments',
    'read_returns',
  ];

  constructor(
    private readonly http: HttpService,
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  /**
   * Shopify OAuth redirect
   * @param shop The merchant's shop domain (e.g. store.myshopify.com)
   * @param storeId Your internal database ID for state tracking
   */
  async getAuthUrl(shop: string, storeId: string): Promise<string> {
    // Ensure the shop URL is clean (remove https:// etc)
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(cleanShop)) {
      throw new BadRequestException('Invalid Shopify domain');
    }

    const params = new URLSearchParams({
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      scope: this.scopes.join(','),
      redirect_uri: process.env.SHOPIFY_REDIRECT_URI!,
      state: storeId,
    });

    await this.supabase
      .from('stores')
      .update({ shopDomain: cleanShop })
      .eq('id', storeId);

    // Use the merchant's shop domain as the host
    return `https://${cleanShop}/admin/oauth/authorize?${params}`;
  }

  /**
   * OAuth callback handler
   */
  async handleCallback(query: any): Promise<void> {
    const { shop, hmac, code, state } = query;

    if (!shop || !hmac || !code || !state) {
      throw new BadRequestException('Invalid Shopify OAuth callback');
    }

    this.verifyHmac(query);

    // Exchange code → offline access token
    const tokenResponse = await firstValueFrom(
      this.http.post(`https://${shop}/admin/oauth/access_token`, {
        client_id: process.env.SHOPIFY_CLIENT_ID!,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
        code,
      }),
    );

    const { access_token, scope } = tokenResponse.data;

    if (!access_token) {
      throw new Error('Shopify did not return access token');
    }

    // Persist credentials
    await this.supabase.from('store_credentials').upsert({
      store_id: state,
      credentials: {
        accessToken: access_token,
        shopDomain: shop,
        scopes: scope.split(','),
      },
      updated_at: new Date().toISOString(),
    });

    // Update store
    await this.supabase
      .from('stores')
      .update({
        auth_status: 'active',
        shopDomain: shop,
        auth_expires_at: null, // offline token
      })
      .eq('id', state);
  }

  /**
   * Shopify HMAC verification (MANDATORY)
   */
  private verifyHmac(query: any): void {
    const { hmac, ...rest } = query;

    const message = Object.keys(rest)
      .sort()
      .map((key) => `${key}=${rest[key]}`)
      .join('&');

    const generated = createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET!)
      .update(message)
      .digest('hex');

    if (generated !== hmac) {
      throw new BadRequestException('Invalid Shopify HMAC');
    }
  }
}
