import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShopifyWebhookController } from './shopify.controller';
import { ShopifyWebhookGuard } from '../../guards/shopify-webhook.guard';
import { ShopifyWebhookService } from './shopify.service';
import { ShopifyWebhookProcessor } from './shopify.processor';
import { ShopifyService } from '../../../../connectors/shopify/shopify.service';

@Module({
  imports: [ConfigModule],
  controllers: [ShopifyWebhookController],
  providers: [
    ShopifyWebhookGuard,
    ShopifyWebhookService,
    ShopifyService,
    ShopifyWebhookProcessor,
  ],
  exports: [ShopifyService, ShopifyWebhookService],
})
export class ShopifyWebhookModule {}
