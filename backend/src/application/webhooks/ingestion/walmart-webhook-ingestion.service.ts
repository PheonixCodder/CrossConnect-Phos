import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  WEBHOOK_EVENTS_REPOSITORY,
  WebhookEventsRepositoryPort,
} from '../../../domain/repositories/repository-ports';
import { WalmartWebhookEvent } from '../walmart/walmart.types';
import { WebhookJobPayload } from '../webhook-event.types';
import { WebhookIngestResult } from './shopify-webhook-ingestion.service';

export interface WalmartWebhookIngestEvent {
  eventId?: string;
  storeId: string;
  userId: string;
  payload: WalmartWebhookEvent;
}

@Injectable()
export class WalmartWebhookIngestionService {
  constructor(
    @Inject(WEBHOOK_EVENTS_REPOSITORY)
    private readonly eventsRepository: WebhookEventsRepositoryPort,
  ) {}

  async ingest(event: WalmartWebhookIngestEvent): Promise<WebhookIngestResult> {
    const topic = event.payload.source.eventType;
    const eventId = event.eventId || event.payload.source.eventId;

    if (!eventId) {
      throw new BadRequestException('Missing Walmart webhook event id');
    }

    const persisted = await this.eventsRepository.persistRawEvent({
      provider: 'walmart',
      storeId: event.storeId,
      userId: event.userId,
      eventId,
      topic,
      payload: event.payload,
      receivedAt: event.payload.source.eventTime,
    });

    if (persisted.duplicate) {
      return { duplicate: true };
    }

    return {
      duplicate: false,
      jobPayload: {
        rawEventId: persisted.rawEventId,
        provider: 'walmart',
        storeId: event.storeId,
        userId: event.userId,
        eventId,
        topic,
        reason: 'webhook',
      },
    };
  }
}
