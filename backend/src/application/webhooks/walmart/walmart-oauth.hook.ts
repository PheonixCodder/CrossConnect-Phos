import { Injectable } from '@nestjs/common';
import { WalmartWebhookService } from './walmart-webhook-subscription.service';

@Injectable()
export class WalmartOAuthHook {
  constructor(private readonly webhooks: WalmartWebhookService) {}

  async afterOAuth(token: string, storeId: string, userId: string) {
    await this.webhooks.createWebhook(token, storeId, userId);
  }
}
