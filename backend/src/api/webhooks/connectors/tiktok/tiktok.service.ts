import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TikTokWebhooksService {
  private readonly logger = new Logger(TikTokWebhooksService.name);

  constructor(private readonly config: ConfigService) {}

  /* ---------------- SIGNATURE VERIFICATION ---------------- */

  verifySignature(rawBody: Buffer, timestamp: string, signature: string) {
    const secret = this.config.get<string>('TIKTOK_APP_SECRET');

    if (!secret || !timestamp || !signature) {
      throw new UnauthorizedException('Missing TikTok signature headers');
    }

    const payload = timestamp + rawBody.toString('utf8');

    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expected !== signature) {
      throw new UnauthorizedException('Invalid TikTok webhook signature');
    }
  }

  /* ---------------- EVENT ROUTING ---------------- */

  async verifyAndProcess(
    storeId: string,
    rawBody: Buffer,
    body: any,
    signature: string,
    timestamp: string,
  ) {
    this.verifySignature(rawBody, timestamp, signature);

    // 1. Persist raw event
    // await this.persistRawEvent(storeId, body);

    // 2. Route by event_type
    switch (body.event_type) {
      case 'ORDER_STATUS_UPDATED':
        await this.handleOrderUpdate(storeId, body);
        break;

      case 'INVENTORY_UPDATED':
        await this.handleInventory(storeId, body);
        break;

      case 'RETURN_CREATED':
        await this.handleReturn(storeId, body);
        break;

      default:
        this.logger.warn(`Unhandled TikTok event ${body.event_type}`);
    }
  }

  private async handleOrderUpdate(storeId: string, payload: any) {}
  private async handleInventory(storeId: string, payload: any) {}
  private async handleReturn(storeId: string, payload: any) {}
}
