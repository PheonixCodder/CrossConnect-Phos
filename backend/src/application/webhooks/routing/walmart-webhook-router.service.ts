import { Injectable, Logger } from '@nestjs/common';
import { WebhookJobPayload } from '../webhook-event.types';

const ORDER_TOPICS = new Set(['PO_CREATED', 'PO_LINE_AUTOCANCELLED']);
const INVENTORY_TOPICS = new Set(['INVENTORY_OOS']);
const RETURNS_TOPICS = new Set(['RETURN_CREATED']);

@Injectable()
export class WalmartWebhookRouterService {
  private readonly logger = new Logger(WalmartWebhookRouterService.name);

  route(event: WebhookJobPayload): void {
    if (ORDER_TOPICS.has(event.topic)) {
      this.logger.log(
        `Queued Walmart order webhook ${event.eventId} for store ${event.storeId}`,
      );
      return;
    }

    if (INVENTORY_TOPICS.has(event.topic)) {
      this.logger.log(
        `Queued Walmart inventory webhook ${event.eventId} for store ${event.storeId}`,
      );
      return;
    }

    if (RETURNS_TOPICS.has(event.topic)) {
      this.logger.log(
        `Queued Walmart returns webhook ${event.eventId} for store ${event.storeId}`,
      );
      return;
    }

    this.logger.warn(
      `Unhandled Walmart webhook topic ${event.topic} for store ${event.storeId}`,
    );
  }
}
