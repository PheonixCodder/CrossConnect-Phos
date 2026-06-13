import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  ShopifyWebhookIngestionService,
  ShopifyWebhookIngestEvent,
} from '../../../../application/webhooks/ingestion/shopify-webhook-ingestion.service';
import { ShopifyWebhookRouterService } from '../../../../application/webhooks/routing/shopify-webhook-router.service';
import { WebhookJobPayload } from '../../../../application/webhooks/webhook-event.types';

@Processor('shopify-webhooks', { concurrency: 5 })
export class ShopifyWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(ShopifyWebhookProcessor.name);

  constructor(
    @InjectQueue('shopify-webhooks')
    private readonly queue: Queue<WebhookJobPayload>,
    private readonly ingestion: ShopifyWebhookIngestionService,
    private readonly router: ShopifyWebhookRouterService,
  ) {
    super();
  }

  async enqueue(event: ShopifyWebhookIngestEvent): Promise<void> {
    const result = await this.ingestion.ingest(event);

    if (result.duplicate) {
      this.logger.debug(
        `Duplicate Shopify webhook ignored: ${event.webhookId}`,
      );
      return;
    }

    if (!result.jobPayload) {
      return;
    }

    await this.queue.add('shopify.webhook', result.jobPayload, {
      jobId: `webhook-shopify-${event.webhookId}`,
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
