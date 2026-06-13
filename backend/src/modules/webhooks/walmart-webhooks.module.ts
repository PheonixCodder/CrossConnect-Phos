import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SupabaseModule } from 'nestjs-supabase-js';
import { WalmartWebhookIngestionService } from '../../application/webhooks/ingestion/walmart-webhook-ingestion.service';
import { WalmartWebhookRouterService } from '../../application/webhooks/routing/walmart-webhook-router.service';
import { WalmartOAuthHook } from '../../application/webhooks/walmart/walmart-oauth.hook';
import { WalmartWebhookService } from '../../application/webhooks/walmart/walmart-webhook-subscription.service';
import {
  STORE_CREDENTIALS_REPOSITORY,
  STORES_REPOSITORY,
  WEBHOOK_EVENTS_REPOSITORY,
} from '../../domain/repositories/repository-ports';
import { EventsRepository } from '../../infrastructure/persistence/supabase/repositories/raw_events.repository';
import { StoreCredentialsService } from '../../infrastructure/persistence/supabase/repositories/store_credentials.repository';
import { StoresRepository } from '../../infrastructure/persistence/supabase/repositories/stores.repository';
import { WalmartWebhookProcessor } from '../../infrastructure/queues/bullmq/webhooks/walmart-webhook.processor';
import { WalmartWebhookController } from '../../interfaces/webhooks/controllers/walmart-webhook.controller';
import { WalmartWebhookGuard } from '../../interfaces/webhooks/guards/walmart-webhook.guard';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SupabaseModule.injectClient(),
    SharedModule,
    BullModule.registerQueue({
      name: 'walmart-webhooks',
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
  providers: [
    WalmartWebhookGuard,
    WalmartWebhookService,
    WalmartWebhookIngestionService,
    WalmartWebhookRouterService,
    WalmartWebhookProcessor,
    WalmartOAuthHook,
    StoresRepository,
    StoreCredentialsService,
    EventsRepository,
    {
      provide: STORES_REPOSITORY,
      useExisting: StoresRepository,
    },
    {
      provide: STORE_CREDENTIALS_REPOSITORY,
      useExisting: StoreCredentialsService,
    },
    {
      provide: WEBHOOK_EVENTS_REPOSITORY,
      useExisting: EventsRepository,
    },
  ],
  controllers: [WalmartWebhookController],
  exports: [WalmartOAuthHook],
})
export class WalmartWebhooksModule {}
