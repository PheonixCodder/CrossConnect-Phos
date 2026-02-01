import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ShopifyWebhookProcessor {
  private readonly logger = new Logger(ShopifyWebhookProcessor.name);

  async enqueue(event: {
    webhookId: string;
    topic: string;
    storeId: string;
    userId: string;
    payload: any;
  }) {
    // Store webhookId with UNIQUE constraint (DB)
    // If duplicate → ignore
    await this.process(event);
  }

  private async process(event: any) {
    switch (event.topic) {
      case 'ORDERS_CREATE':
        break;
      case 'ORDERS_UPDATED':
        break;
      case 'ORDERS_CANCELLED':
        break;
      case 'ORDERS_PAID':
        break;
      case 'ORDERS_FULFILLED':
        break;
      case 'ORDERS_PARTIALLY_FULFILLED':
        break;
      case 'ORDERS_EDITED':
        break;
      case 'PRODUCTS_UPDATE':
        break;
      case 'REFUNDS_CREATE':
        break;
      case 'RETURNS_REQUEST':
        break;
      case 'RETURNS_APPROVE':
        break;
      case 'RETURNS_PROCESS':
        break;
      case 'RETURNS_UPDATE':
        break;
      case 'RETURNS_CLOSE':
        break;
      case 'INVENTORY_ITEMS_UPDATE':
        break;
      case 'INVENTORY_ITEMS_CREATE':
        break;
      case 'INVENTORY_ITEMS_DELETE':
        break;
      case 'INVENTORY_LEVELS_UPDATE':
        break;
      case 'INVENTORY_LEVELS_CONNECT':
        break;
      case 'INVENTORY_LEVELS_DISCONNECT':
        break;
      case 'INVENTORY_SHIPMENTS_CREATE':
        break;
      case 'INVENTORY_SHIPMENTS_DELETE':
        break;
      case 'INVENTORY_SHIPMENTS_MARK_IN_TRANSIT':
        break;
      case 'INVENTORY_SHIPMENTS_RECEIVE_ITEMS':
        break;
      case 'INVENTORY_SHIPMENTS_ADD_ITEMS':
        break;
      case 'INVENTORY_SHIPMENTS_REMOVE_ITEMS':
        break;
      case 'INVENTORY_SHIPMENTS_UPDATE_ITEM_QUANTITIES':
        break;
      case 'INVENTORY_SHIPMENTS_UPDATE_TRACKING':
        break;
      case 'INVENTORY_TRANSFERS_ADD_ITEMS':
        break;
      case 'INVENTORY_TRANSFERS_REMOVE_ITEMS':
        break;
      case 'INVENTORY_TRANSFERS_CANCEL':
        break;
      case 'INVENTORY_TRANSFERS_READY_TO_SHIP':
        break;
      case 'INVENTORY_TRANSFERS_COMPLETE':
        break;
      case 'INVENTORY_TRANSFERS_UPDATE_ITEM_QUANTITIES':
        break;
    }
  }
}
