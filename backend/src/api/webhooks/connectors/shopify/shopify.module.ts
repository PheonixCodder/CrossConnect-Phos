import { StoresRepository } from './../../../../supabase/repositories/stores.repository';
import { Module } from '@nestjs/common';
import { ShopifyWebhooksModule } from '@nestjs-shopify/webhooks';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ShopifyWebhooksService } from './shopify.service';
import { ShopifyWebhookController } from './shopify.controller';
import { ShopifyMultiTenantGuard } from '../../guards/shopify-webhook.guard';

@Module({
  imports: [HttpModule, ConfigModule, ShopifyWebhooksModule],
  providers: [
    ShopifyWebhooksService,
    ShopifyMultiTenantGuard,
    StoresRepository,
  ],
  controllers: [ShopifyWebhookController],
  exports: [ShopifyWebhooksService],
})
export class ShopifyIntegrationModule {}
