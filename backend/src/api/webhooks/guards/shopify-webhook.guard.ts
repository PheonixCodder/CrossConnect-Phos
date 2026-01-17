import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  RawBodyRequest,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { StoresRepository } from '../../../supabase/repositories/stores.repository';

@Injectable()
export class ShopifyMultiTenantGuard implements CanActivate {
  constructor(private readonly storesRepo: StoresRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RawBodyRequest<any>>();
    const { userId, orgId } = request.params;

    const hmac = request.headers['x-shopify-hmac-sha256'] as string | undefined;
    const shopDomainHeader = request.headers['x-shopify-shop-domain'] as
      | string
      | undefined;

    // Load tenant-specific Shopify credentials
    const store = await this.storesRepo.getCredentials(
      userId,
      orgId,
      'shopify',
    );

    const creds =
      typeof store.credentials === 'string'
        ? JSON.parse(store.credentials)
        : store.credentials;

    const apiSecret = creds.apiSecret as string | undefined;
    const storedShopDomain = creds.shopDomain ?? store.shopDomain;

    if (!apiSecret || !hmac || !request.rawBody) {
      throw new UnauthorizedException('Security validation failed');
    }

    // Optional: ensure the webhook's shop domain matches the tenant's known shop
    if (
      shopDomainHeader &&
      storedShopDomain &&
      shopDomainHeader !== storedShopDomain
    ) {
      throw new UnauthorizedException('Shop domain mismatch');
    }

    const generatedHash = crypto
      .createHmac('sha256', apiSecret)
      .update(request.rawBody)
      .digest('base64');

    const hmacBuffer = Buffer.from(hmac, 'utf8');
    const generatedBuffer = Buffer.from(generatedHash, 'utf8');

    if (
      hmacBuffer.length !== generatedBuffer.length ||
      !crypto.timingSafeEqual(hmacBuffer, generatedBuffer)
    ) {
      throw new UnauthorizedException('Invalid Shopify HMAC signature');
    }

    return true;
  }
}
