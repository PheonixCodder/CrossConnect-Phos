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
export class WalmartWebhookGuard implements CanActivate {
  constructor(private readonly storesRepo: StoresRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RawBodyRequest<any>>();

    const signature = req.headers['wm_sec.auth_signature'] as string;
    const { storeId } = req.params;

    if (!signature || !req.rawBody) {
      throw new UnauthorizedException('Missing signature');
    }

    const store = await this.storesRepo.getCredentials(storeId as string);
    const creds =
      typeof store.credentials === 'string'
        ? JSON.parse(store.credentials)
        : store.credentials;

    const expected = crypto
      .createHmac('sha256', creds.clientSecret as string)
      .update(req.rawBody as crypto.BinaryLike)
      .digest('base64');

    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
