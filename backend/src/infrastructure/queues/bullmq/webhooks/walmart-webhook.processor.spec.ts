import { BadRequestException } from '@nestjs/common';
import { WalmartWebhookEvent } from '../../../../application/webhooks/walmart/walmart.types';
import { WalmartWebhookIngestionService } from '../../../../application/webhooks/ingestion/walmart-webhook-ingestion.service';
import { WalmartWebhookRouterService } from '../../../../application/webhooks/routing/walmart-webhook-router.service';
import { WalmartWebhookProcessor } from './walmart-webhook.processor';

describe('WalmartWebhookProcessor', () => {
  const queue = {
    add: jest.fn(),
  };

  const ingestion = {
    ingest: jest.fn(),
  };

  const router = {
    route: jest.fn(),
  };

  const payload: WalmartWebhookEvent = {
    source: {
      eventType: 'PO_CREATED',
      eventTime: '2026-06-10T10:00:00.000Z',
      eventId: 'payload-event-1',
    },
    payload: { purchaseOrderId: 'po-1' },
  };

  let processor: WalmartWebhookProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new WalmartWebhookProcessor(
      queue as never,
      ingestion as unknown as WalmartWebhookIngestionService,
      router as unknown as WalmartWebhookRouterService,
    );
  });

  it('persists the raw webhook and enqueues durable work', async () => {
    ingestion.ingest.mockResolvedValue({
      duplicate: false,
      jobPayload: {
        rawEventId: 'raw-event-1',
        provider: 'walmart',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'header-event-1',
        topic: 'PO_CREATED',
        reason: 'webhook',
      },
    });

    await processor.enqueue({
      eventId: 'header-event-1',
      storeId: 'store-1',
      userId: 'user-1',
      payload,
    });

    expect(ingestion.ingest).toHaveBeenCalledWith({
      eventId: 'header-event-1',
      storeId: 'store-1',
      userId: 'user-1',
      payload,
    });
    expect(queue.add).toHaveBeenCalledWith(
      'walmart.webhook',
      {
        rawEventId: 'raw-event-1',
        provider: 'walmart',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'header-event-1',
        topic: 'PO_CREATED',
        reason: 'webhook',
      },
      expect.objectContaining({
        jobId: 'webhook-walmart-header-event-1',
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      }),
    );
  });

  it('falls back to the payload event id when the header is absent', async () => {
    ingestion.ingest.mockResolvedValue({
      duplicate: false,
      jobPayload: {
        rawEventId: 'raw-event-1',
        provider: 'walmart',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'payload-event-1',
        topic: 'PO_CREATED',
        reason: 'webhook',
      },
    });

    await processor.enqueue({
      storeId: 'store-1',
      userId: 'user-1',
      payload,
    });

    expect(queue.add).toHaveBeenCalledWith(
      'walmart.webhook',
      expect.objectContaining({
        eventId: 'payload-event-1',
      }),
      expect.objectContaining({
        jobId: 'webhook-walmart-payload-event-1',
      }),
    );
  });

  it('does not enqueue duplicate webhooks', async () => {
    ingestion.ingest.mockResolvedValue({
      duplicate: true,
    });

    await processor.enqueue({
      eventId: 'header-event-1',
      storeId: 'store-1',
      userId: 'user-1',
      payload,
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('rejects webhooks without an event id', async () => {
    ingestion.ingest.mockRejectedValue(
      new BadRequestException('Missing Walmart webhook event id'),
    );

    await expect(
      processor.enqueue({
        storeId: 'store-1',
        userId: 'user-1',
        payload: {
          ...payload,
          source: {
            ...payload.source,
            eventId: '',
          },
        },
      }),
    ).rejects.toThrow('Missing Walmart webhook event id');
  });

  it('processes routed and unknown topics without throwing', async () => {
    await processor.process({
      data: {
        rawEventId: 'raw-1',
        provider: 'walmart',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'event-1',
        topic: 'PO_CREATED',
        reason: 'webhook',
      },
    } as never);

    await processor.process({
      data: {
        rawEventId: 'raw-2',
        provider: 'walmart',
        storeId: 'store-1',
        userId: 'user-1',
        eventId: 'event-2',
        topic: 'UNKNOWN_TOPIC',
        reason: 'webhook',
      },
    } as never);

    expect(router.route).toHaveBeenCalledTimes(2);
  });
});
