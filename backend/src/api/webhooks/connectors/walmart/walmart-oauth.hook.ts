import { Injectable } from '@nestjs/common';
import { WalmartWebhookService } from './walmart.service';

@Injectable()
export class WalmartOAuthHook {
  constructor(private readonly webhooks: WalmartWebhookService) {}

  async afterOAuth(token: string, storeId: string, userId: string) {
    await this.webhooks.createWebhook(token, storeId, userId, {
      eventType: 'PO_CREATED',
      eventVersion: '1.0',
      resourceName: 'ORDER',
    });

    await this.webhooks.createWebhook(token, storeId, userId, {
      eventType: 'INVENTORY_OOS',
      eventVersion: '1.0',
      resourceName: 'INVENTORY',
    });
  }
}
