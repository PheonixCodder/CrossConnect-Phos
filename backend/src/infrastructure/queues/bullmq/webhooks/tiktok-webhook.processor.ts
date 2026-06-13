import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  TikTokWebhookIngestionService,
  TikTokWebhookIngestEvent,
} from '../../../../application/webhooks/ingestion/tiktok-webhook-ingestion.service';
import { TikTokWebhookHandlerService } from '../../../../application/webhooks/tiktok/tiktok-webhook-handler.service';
import { WebhookJobPayload } from '../../../../application/webhooks/webhook-event.types';
import {
  WEBHOOK_EVENTS_REPOSITORY,
  WebhookEventsRepositoryPort,
} from '../../../../domain/repositories/repository-ports';
import { getTikTokEventId } from '../../../../application/webhooks/tiktok/tiktok-webhook-normalizers';

@Processor('tiktok-webhooks', { concurrency: 5 })
export class TikTokWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(TikTokWebhookProcessor.name);

  constructor(
    @InjectQueue('tiktok-webhooks')
    private readonly queue: Queue<WebhookJobPayload>,
    private readonly ingestion: TikTokWebhookIngestionService,
    private readonly handler: TikTokWebhookHandlerService,
    @Inject(WEBHOOK_EVENTS_REPOSITORY)
    private readonly eventsRepository: WebhookEventsRepositoryPort,
  ) {
    super();
  }

  async enqueue(event: TikTokWebhookIngestEvent): Promise<void> {
    const result = await this.ingestion.ingest(event);

    if (!result) {
      return;
    }

    const eventId = getTikTokEventId(event.payload as Record<string, unknown>);

    if (result.duplicate) {
      this.logger.debug(`Duplicate TikTok webhook ignored: ${eventId}`);
      return;
    }

    if (!result.jobPayload) {
      return;
    }

    await this.queue.add('tiktok.webhook', result.jobPayload, {
      jobId: `webhook-tiktok-${eventId}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async process(job: Job<WebhookJobPayload>): Promise<void> {
    const payload = await this.eventsRepository.getRawEventPayload(
      job.data.rawEventId,
    );

    if (!payload) {
      this.logger.warn(
        `TikTok raw webhook payload not found: ${job.data.rawEventId}`,
      );
      return;
    }

    await this.handler.processForStore(job.data.storeId, payload);
  }
}
