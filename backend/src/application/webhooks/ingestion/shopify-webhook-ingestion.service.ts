import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  WEBHOOK_EVENTS_REPOSITORY,
  WebhookEventsRepositoryPort,
} from '../../../domain/repositories/repository-ports';
import { WebhookJobPayload } from '../webhook-event.types';

export interface ShopifyWebhookIngestEvent {
  webhookId: string;
  topic: string;
  storeId: string;
  userId: string;
  payload: unknown;
}

export interface WebhookIngestResult {
  duplicate: boolean;
  jobPayload?: WebhookJobPayload;
}

@Injectable()
export class ShopifyWebhookIngestionService {
  constructor(
    @Inject(WEBHOOK_EVENTS_REPOSITORY)
    private readonly eventsRepository: WebhookEventsRepositoryPort,
  ) {}

  async ingest(event: ShopifyWebhookIngestEvent): Promise<WebhookIngestResult> {
    if (!event.webhookId) {
      throw new BadRequestException('Missing Shopify webhook id');
    }

    const persisted = await this.eventsRepository.persistRawEvent({
      provider: 'shopify',
      storeId: event.storeId,
      userId: event.userId,
      eventId: event.webhookId,
      topic: event.topic,
      payload: event.payload,
    });

    if (persisted.duplicate) {
      return { duplicate: true };
    }

    return {
      duplicate: false,
      jobPayload: {
        rawEventId: persisted.rawEventId,
        provider: 'shopify',
        storeId: event.storeId,
        userId: event.userId,
        eventId: event.webhookId,
        topic: event.topic,
        reason: 'webhook',
      },
    };
  }
}
