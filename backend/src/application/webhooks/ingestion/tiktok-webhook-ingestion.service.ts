import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  WEBHOOK_EVENTS_REPOSITORY,
  WebhookEventsRepositoryPort,
} from '../../../domain/repositories/repository-ports';
import { TikTokWebhookHandlerService } from '../tiktok/tiktok-webhook-handler.service';
import {
  getTikTokEventId,
  getTikTokEventTopic,
  toTikTokReceivedAt,
} from '../tiktok/tiktok-webhook-normalizers';
import { WebhookIngestResult } from './shopify-webhook-ingestion.service';

export interface TikTokWebhookIngestEvent {
  tiktokShopId: string;
  payload: unknown;
}

@Injectable()
export class TikTokWebhookIngestionService {
  private readonly logger = new Logger(TikTokWebhookIngestionService.name);

  constructor(
    @Inject(WEBHOOK_EVENTS_REPOSITORY)
    private readonly eventsRepository: WebhookEventsRepositoryPort,
    private readonly handler: TikTokWebhookHandlerService,
  ) {}

  async ingest(event: TikTokWebhookIngestEvent): Promise<WebhookIngestResult | null> {
    const storeId = await this.handler.resolveStoreIdByShopId(event.tiktokShopId);

    if (!storeId) {
      this.logger.warn(
        `Ignoring TikTok webhook for unknown shop ${event.tiktokShopId}`,
      );
      return null;
    }

    const payload = event.payload as Record<string, unknown>;
    const eventId = getTikTokEventId(payload);
    const topic = getTikTokEventTopic(payload.type);

    const persisted = await this.eventsRepository.persistRawEvent({
      provider: 'tiktok',
      storeId,
      eventId,
      topic,
      payload: event.payload,
      receivedAt: toTikTokReceivedAt(payload.timestamp),
    });

    if (persisted.duplicate) {
      return { duplicate: true };
    }

    return {
      duplicate: false,
      jobPayload: {
        rawEventId: persisted.rawEventId,
        provider: 'tiktok',
        storeId,
        eventId,
        topic,
        reason: 'webhook',
      },
    };
  }
}
