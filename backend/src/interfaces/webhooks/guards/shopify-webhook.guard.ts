import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  RawBodyRequest,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShopifyWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest<any>>();

    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    if (!hmac || !topic || !shop || !req.rawBody) {
      throw new UnauthorizedException();
    }

    const secret = this.config.get<string>('SHOPIFY_CLIENT_SECRET');

    const digest = crypto
      .createHmac('sha256', secret!)
      .update(req.rawBody as crypto.BinaryLike)
      .digest('base64');

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(digest))) {
      throw new UnauthorizedException('Invalid HMAC');
    }

    return true;
  }
}
