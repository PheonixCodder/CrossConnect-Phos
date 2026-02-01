import { Injectable, Logger } from '@nestjs/common';
import { WalmartWebhookEvent } from './walmart.types';

@Injectable()
export class WalmartWebhookProcessor {
  private readonly logger = new Logger(WalmartWebhookProcessor.name);

  async enqueue(event: {
    eventId: string;
    storeId: string;
    userId: string;
    payload: WalmartWebhookEvent;
  }) {
    // Store eventId with UNIQUE constraint
    // Duplicate → ignore
    await this.process(event);
  }

  private async process(event: {
    storeId: string;
    userId: string;
    payload: WalmartWebhookEvent;
  }) {
    const { eventType } = event.payload.source;

    switch (eventType) {
      case 'INVENTORY_OOS':
        break;

      case 'PO_CREATED':
        break;

      case 'PO_LINE_AUTOCANCELLED':
        break;

      case 'RETURN_CREATED':
        break;

      default:
        this.logger.warn(`Unhandled event ${eventType}`);
    }
  }
}
