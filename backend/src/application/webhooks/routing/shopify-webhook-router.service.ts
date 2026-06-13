import { Injectable, Logger } from '@nestjs/common';
import { WebhookJobPayload } from '../webhook-event.types';

const ORDER_TOPICS = new Set([
  'ORDERS_CREATE',
  'ORDERS_UPDATED',
  'ORDERS_CANCELLED',
  'ORDERS_PAID',
  'ORDERS_FULFILLED',
  'ORDERS_PARTIALLY_FULFILLED',
  'ORDERS_EDITED',
]);

const CATALOG_TOPICS = new Set([
  'PRODUCTS_UPDATE',
  'INVENTORY_ITEMS_UPDATE',
  'INVENTORY_ITEMS_CREATE',
  'INVENTORY_ITEMS_DELETE',
  'INVENTORY_LEVELS_UPDATE',
  'INVENTORY_LEVELS_CONNECT',
  'INVENTORY_LEVELS_DISCONNECT',
]);

const RETURNS_TOPICS = new Set([
  'REFUNDS_CREATE',
  'RETURNS_REQUEST',
  'RETURNS_APPROVE',
  'RETURNS_PROCESS',
  'RETURNS_UPDATE',
  'RETURNS_CLOSE',
]);

const LOGISTICS_TOPICS = new Set([
  'INVENTORY_SHIPMENTS_CREATE',
  'INVENTORY_SHIPMENTS_DELETE',
  'INVENTORY_SHIPMENTS_MARK_IN_TRANSIT',
  'INVENTORY_SHIPMENTS_RECEIVE_ITEMS',
  'INVENTORY_SHIPMENTS_ADD_ITEMS',
  'INVENTORY_SHIPMENTS_REMOVE_ITEMS',
  'INVENTORY_SHIPMENTS_UPDATE_ITEM_QUANTITIES',
  'INVENTORY_SHIPMENTS_UPDATE_TRACKING',
  'INVENTORY_TRANSFERS_ADD_ITEMS',
  'INVENTORY_TRANSFERS_REMOVE_ITEMS',
  'INVENTORY_TRANSFERS_CANCEL',
  'INVENTORY_TRANSFERS_READY_TO_SHIP',
  'INVENTORY_TRANSFERS_COMPLETE',
  'INVENTORY_TRANSFERS_UPDATE_ITEM_QUANTITIES',
]);

@Injectable()
export class ShopifyWebhookRouterService {
  private readonly logger = new Logger(ShopifyWebhookRouterService.name);

  route(event: WebhookJobPayload): void {
    if (ORDER_TOPICS.has(event.topic)) {
      this.logger.log(
        `Queued Shopify order webhook ${event.eventId} for store ${event.storeId}`,
      );
      return;
    }

    if (CATALOG_TOPICS.has(event.topic)) {
      this.logger.log(
        `Queued Shopify catalog webhook ${event.eventId} for store ${event.storeId}`,
      );
      return;
    }

    if (RETURNS_TOPICS.has(event.topic)) {
      this.logger.log(
        `Queued Shopify returns webhook ${event.eventId} for store ${event.storeId}`,
      );
      return;
    }

    if (LOGISTICS_TOPICS.has(event.topic)) {
      this.logger.debug(
        `Stored Shopify logistics webhook ${event.eventId} for store ${event.storeId}`,
      );
      return;
    }

    this.logger.warn(
      `Unsupported Shopify webhook topic ${event.topic} for store ${event.storeId}`,
    );
  }
}
