import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  WalmartWebhookIngestionService,
  WalmartWebhookIngestEvent,
} from '../../../../application/webhooks/ingestion/walmart-webhook-ingestion.service';
import { WalmartWebhookRouterService } from '../../../../application/webhooks/routing/walmart-webhook-router.service';
import { WebhookJobPayload } from '../../../../application/webhooks/webhook-event.types';

@Processor('walmart-webhooks', { concurrency: 5 })
export class WalmartWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WalmartWebhookProcessor.name);

  constructor(
    @InjectQueue('walmart-webhooks')
    private readonly queue: Queue<WebhookJobPayload>,
    private readonly ingestion: WalmartWebhookIngestionService,
    private readonly router: WalmartWebhookRouterService,
  ) {
    super();
  }

  async enqueue(event: WalmartWebhookIngestEvent): Promise<void> {
    const result = await this.ingestion.ingest(event);
    const eventId = event.eventId || event.payload.source.eventId;

    if (result.duplicate) {
      this.logger.debug(`Duplicate Walmart webhook ignored: ${eventId}`);
      return;
    }

    if (!result.jobPayload) {
      return;
    }

    await this.queue.add('walmart.webhook', result.jobPayload, {
      jobId: `webhook-walmart-${eventId}`,
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
    this.router.route(job.data);
  }
}
