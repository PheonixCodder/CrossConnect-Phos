import { BadRequestException } from '@nestjs/common';
import { ShopifyWebhookIngestionService } from '../../../../application/webhooks/ingestion/shopify-webhook-ingestion.service';
import { ShopifyWebhookRouterService } from '../../../../application/webhooks/routing/shopify-webhook-router.service';
import { ShopifyWebhookProcessor } from './shopify-webhook.processor';

describe('ShopifyWebhookProcessor', () => {
  const queue = {
    add: jest.fn(),
  };

  const ingestion = {
    ingest: jest.fn(),
  };

  const router = {
    route: jest.fn(),
  };

  let processor: ShopifyWebhookProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new ShopifyWebhookProcessor(
      queue as never,
      ingestion as unknown as ShopifyWebhookIngestionService,
      router as unknown as ShopifyWebhookRouterService,
    );
  });

  it('persists the raw webhook and enqueues durable work', async () => {
    ingestion.ingest.mockResolvedValue({
      duplicate: false,
      jobPayload: {
        rawEventId: 'raw-event-1',
        provider: 'shopify',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'webhook-1',
        topic: 'ORDERS_CREATE',
        reason: 'webhook',
      },
    });

    await processor.enqueue({
      webhookId: 'webhook-1',
      topic: 'ORDERS_CREATE',
      storeId: 'store-1',
      userId: 'user-1',
      payload: { id: 123 },
    });

    expect(ingestion.ingest).toHaveBeenCalledWith({
      webhookId: 'webhook-1',
      topic: 'ORDERS_CREATE',
      storeId: 'store-1',
      userId: 'user-1',
      payload: { id: 123 },
    });
    expect(queue.add).toHaveBeenCalledWith(
      'shopify.webhook',
      {
        rawEventId: 'raw-event-1',
        provider: 'shopify',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'webhook-1',
        topic: 'ORDERS_CREATE',
        reason: 'webhook',
      },
      expect.objectContaining({
        jobId: 'webhook-shopify-webhook-1',
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      }),
    );
  });

  it('does not enqueue duplicate webhooks', async () => {
    ingestion.ingest.mockResolvedValue({
      duplicate: true,
    });

    await processor.enqueue({
      webhookId: 'webhook-1',
      topic: 'ORDERS_CREATE',
      storeId: 'store-1',
      userId: 'user-1',
      payload: { id: 123 },
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('rejects webhooks without an event id', async () => {
    ingestion.ingest.mockRejectedValue(
      new BadRequestException('Missing Shopify webhook id'),
    );

    await expect(
      processor.enqueue({
        webhookId: '',
        topic: 'ORDERS_CREATE',
        storeId: 'store-1',
        userId: 'user-1',
        payload: { id: 123 },
      }),
    ).rejects.toThrow('Missing Shopify webhook id');
  });

  it('processes routed, ignored, and unknown topics without throwing', async () => {
    await processor.process({
      data: {
        rawEventId: 'raw-1',
        provider: 'shopify',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'webhook-1',
        topic: 'ORDERS_CREATE',
        reason: 'webhook',
      },
    } as never);

    await processor.process({
      data: {
        rawEventId: 'raw-2',
        provider: 'shopify',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'webhook-2',
        topic: 'INVENTORY_SHIPMENTS_CREATE',
        reason: 'webhook',
      },
    } as never);

    await processor.process({
      data: {
        rawEventId: 'raw-3',
        provider: 'shopify',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'webhook-3',
        topic: 'UNKNOWN_TOPIC',
        reason: 'webhook',
      },
    } as never);

    expect(router.route).toHaveBeenCalledTimes(3);
  });
});
