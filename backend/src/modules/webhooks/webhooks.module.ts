import { Module } from '@nestjs/common';
import { ShopifyWebhookModule } from './shopify-webhooks.module';
import { TikTokWebhooksModule } from './tiktok-webhooks.module';
import { WalmartWebhooksModule } from './walmart-webhooks.module';

@Module({
  imports: [ShopifyWebhookModule, TikTokWebhooksModule, WalmartWebhooksModule],
})
export class WebhooksModule {}
