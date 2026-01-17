import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';

@Injectable()
export class WalmartWebhookGuard implements CanActivate {
  private readonly logger = new Logger(WalmartWebhookGuard.name);

  constructor(private readonly storesRepo: StoresRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { userId, orgId } = request.params;
    const signature = request.headers['wm_sec.auth_signature']; // Walmart signature header

    if (!signature) {
      this.logger.error(
        `Rejected webhook: Missing signature header for user ${userId}`,
      );
      throw new UnauthorizedException('Missing signature');
    }

    // 1. Fetch user-specific secret for verification
    const store = await this.storesRepo.getCredentials(
      userId,
      orgId,
      'walmart',
    );
    const creds =
      typeof store.credentials === 'string'
        ? JSON.parse(store.credentials)
        : store.credentials;
    const clientSecret = creds.clientSecret;

    // 2. Re-create the HMAC hash (Walmart typically uses HMAC-SHA256)
    const rawBody = JSON.stringify(request.body);
    const expectedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(rawBody)
      .digest('base64');

    // 3. Verify
    if (signature !== expectedSignature) {
      this.logger.error(
        `Rejected webhook: Invalid signature for user ${userId}`,
      );
      return false;
    }

    return true;
  }
}
