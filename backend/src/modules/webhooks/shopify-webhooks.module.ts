import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from 'nestjs-supabase-js';
import { ShopifyWebhookIngestionService } from '../../application/webhooks/ingestion/shopify-webhook-ingestion.service';
import { ShopifyWebhookRouterService } from '../../application/webhooks/routing/shopify-webhook-router.service';
import { ShopifyOAuthHook } from '../../application/webhooks/shopify/shopify-oauth.hook';
import { ShopifyWebhookService } from '../../application/webhooks/shopify/shopify-webhook-subscription.service';
import { WEBHOOK_EVENTS_REPOSITORY } from '../../domain/repositories/repository-ports';
import { ShopifyService } from '../../infrastructure/external/connectors/shopify/shopify.service';
import { EventsRepository } from '../../infrastructure/persistence/supabase/repositories/raw_events.repository';
import { ShopifyWebhookProcessor } from '../../infrastructure/queues/bullmq/webhooks/shopify-webhook.processor';
import { ShopifyWebhookController } from '../../interfaces/webhooks/controllers/shopify-webhook.controller';
import { ShopifyWebhookGuard } from '../../interfaces/webhooks/guards/shopify-webhook.guard';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule.injectClient(),
    BullModule.registerQueue({
      name: 'shopify-webhooks',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [ShopifyWebhookController],
  providers: [
    ShopifyWebhookGuard,
    ShopifyWebhookService,
    ShopifyService,
    ShopifyWebhookIngestionService,
    ShopifyWebhookRouterService,
    ShopifyWebhookProcessor,
    ShopifyOAuthHook,
    EventsRepository,
    {
      provide: WEBHOOK_EVENTS_REPOSITORY,
      useExisting: EventsRepository,
    },
  ],
  exports: [ShopifyService, ShopifyWebhookService, ShopifyOAuthHook],
})
export class ShopifyWebhookModule {}
