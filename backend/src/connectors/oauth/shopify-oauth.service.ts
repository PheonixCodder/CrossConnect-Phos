import { Injectable, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../supabase/supabase.types';
import { ShopifyOAuthHook } from '../../api/webhooks/connectors/shopify/shopify-oauth.hook';
import { CryptoService } from '../../common/crypto.service';

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
    private readonly shopifyHook: ShopifyOAuthHook,
    private readonly supabase: SupabaseClient<Database>,
    private readonly crypto: CryptoService,
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
    const { data: creds } = await this.supabase
      .from('store_credentials')
      .select('credentials')
      .eq('store_id', storeId)
      .single();

    if (!creds?.credentials) {
      throw new BadRequestException('Shopify credentials not found');
    }

    const stored = creds.credentials as Record<string, string>;

    const clientId = this.crypto.decrypt(stored.shopifyClientId);

    const params = new URLSearchParams({
      client_id: clientId!,
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

    const { data: creds } = await this.supabase
      .from('store_credentials')
      .select('credentials')
      .eq('store_id', state as string)
      .single();

    if (!creds?.credentials) {
      throw new BadRequestException(
        'Shopify credentials not found for this store',
      );
    }

    const storedCreds = creds.credentials as Record<string, string>;

    const clientId: string = this.crypto.decrypt(storedCreds.shopifyClientId);
    const clientSecret: string = this.crypto.decrypt(
      storedCreds.shopifyClientSecret,
    );

    // Exchange code → offline access token
    const tokenResponse = await firstValueFrom(
      this.http.post(`https://${shop}/admin/oauth/access_token`, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    );

    const { access_token, scope } = tokenResponse.data;

    console.log(access_token, scope);
    if (!access_token) {
      throw new Error('Shopify did not return access token');
    }

    // Persist credentials
    const { error } = await this.supabase.from('store_credentials').upsert(
      {
        store_id: state,
        credentials: {
          ...storedCreds,
          accessToken: this.crypto.encrypt(access_token),
          shopDomain: this.crypto.encrypt(shop),
          scopes: scope.split(','),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'store_id' },
    );
    console.log(error);

    // Update store
    const { data: storeData } = await this.supabase
      .from('stores')
      .update({
        auth_status: 'active',
        shopDomain: shop,
        auth_expires_at: null,
      })
      .select('org_id')
      .eq('id', state as string);

    const { data: orgData } = await this.supabase
      .from('organizations')
      .select('created_by')
      .eq('id', storeData![0].org_id);

    // await this.shopifyHook.afterOAuth(
    //   data![0].credentials,
    //   state as string,
    //   orgData![0].created_by,
    // );
  }

  /**
   * Shopify HMAC verification (MANDATORY)
   */
  private verifyHmac(query: any, clientSecret: string): void {
    const { hmac, ...rest } = query;

    const message = Object.keys(rest as object)
      .sort()
      .map((key) => `${key}=${rest[key]}`)
      .join('&');

    const generated = createHmac('sha256', clientSecret)
      .update(message)
      .digest('hex');

    if (generated !== hmac) {
      throw new BadRequestException('Invalid Shopify HMAC');
    }
  }
}
