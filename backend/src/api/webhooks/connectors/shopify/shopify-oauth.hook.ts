import { Injectable } from '@nestjs/common';
import { ShopifyWebhookService } from './shopify.service';

@Injectable()
export class ShopifyOAuthHook {
  constructor(private readonly webhooks: ShopifyWebhookService) {}

  async afterOAuth(credentials: any, storeId: string, userId: string) {
    await this.webhooks.reconcileWebhooks(credentials, storeId, userId, [
      'ORDERS_CREATE',
      'ORDERS_UPDATED',
      'PRODUCTS_UPDATE',
      'INVENTORY_LEVELS_UPDATE',
    ]);
  }
}
