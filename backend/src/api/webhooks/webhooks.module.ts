import { Module } from '@nestjs/common';
import { ShopifyWebhookModule } from './connectors/shopify/shopify.module';
import { TikTokWebhooksModule } from './connectors/tiktok/tiktok.module';
import { WalmartWebhooksModule } from './connectors/walmart/walmart.module';

@Module({
  imports: [ShopifyWebhookModule, TikTokWebhooksModule, WalmartWebhooksModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class WebhooksModule {}
