import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from 'nestjs-supabase-js';
import { TikTokWebhookIngestionService } from '../../application/webhooks/ingestion/tiktok-webhook-ingestion.service';
import { TikTokWebhookHandlerService } from '../../application/webhooks/tiktok/tiktok-webhook-handler.service';
import { WEBHOOK_EVENTS_REPOSITORY } from '../../domain/repositories/repository-ports';
import { EventsRepository } from '../../infrastructure/persistence/supabase/repositories/raw_events.repository';
import { TikTokWebhookProcessor } from '../../infrastructure/queues/bullmq/webhooks/tiktok-webhook.processor';
import { TikTokWebhookController } from '../../interfaces/webhooks/controllers/tiktok-webhook.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SupabaseModule.injectClient(),
    BullModule.registerQueue({
      name: 'tiktok-webhooks',
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
    TikTokWebhookHandlerService,
    TikTokWebhookIngestionService,
    TikTokWebhookProcessor,
    EventsRepository,
    {
      provide: WEBHOOK_EVENTS_REPOSITORY,
      useExisting: EventsRepository,
    },
  ],
  controllers: [TikTokWebhookController],
})
export class TikTokWebhooksModule {}
