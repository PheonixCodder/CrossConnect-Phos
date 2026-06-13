import { TikTokWebhookIngestionService } from '../../../../application/webhooks/ingestion/tiktok-webhook-ingestion.service';
import { TikTokWebhookHandlerService } from '../../../../application/webhooks/tiktok/tiktok-webhook-handler.service';
import { EventsRepository } from '../../../../infrastructure/persistence/supabase/repositories/raw_events.repository';
import { TikTokWebhookProcessor } from './tiktok-webhook.processor';

describe('TikTokWebhookProcessor', () => {
  const queue = {
    add: jest.fn(),
  };

  const ingestion = {
    ingest: jest.fn(),
  };

  const eventsRepository = {
    getRawEventPayload: jest.fn(),
  };

  const handler = {
    processForStore: jest.fn(),
  };

  const payload = {
    type: 1,
    tts_notification_id: 'notification-1',
    shop_id: 'shop-1',
    timestamp: 1781095200,
    data: {
      order_id: 'order-1',
      order_status: 'CANCEL',
    },
  };

  let processor: TikTokWebhookProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new TikTokWebhookProcessor(
      queue as never,
      ingestion as unknown as TikTokWebhookIngestionService,
      handler as unknown as TikTokWebhookHandlerService,
      eventsRepository as unknown as EventsRepository,
    );
  });

  it('persists the raw webhook and enqueues durable work', async () => {
    ingestion.ingest.mockResolvedValue({
      duplicate: false,
      jobPayload: {
        rawEventId: 'raw-event-1',
        provider: 'tiktok',
        storeId: 'store-1',
        eventId: 'notification-1',
        topic: 'order_status_updated',
        reason: 'webhook',
      },
    });

    await processor.enqueue({
      tiktokShopId: 'shop-1',
      payload,
    });

    expect(ingestion.ingest).toHaveBeenCalledWith({
      tiktokShopId: 'shop-1',
      payload,
    });
    expect(queue.add).toHaveBeenCalledWith(
      'tiktok.webhook',
      {
        rawEventId: 'raw-event-1',
        provider: 'tiktok',
        storeId: 'store-1',
        eventId: 'notification-1',
        topic: 'order_status_updated',
        reason: 'webhook',
      },
      expect.objectContaining({
        jobId: 'webhook-tiktok-notification-1',
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
      tiktokShopId: 'shop-1',
      payload,
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('ignores webhooks for unknown stores', async () => {
    ingestion.ingest.mockResolvedValue(null);

    await processor.enqueue({
      tiktokShopId: 'shop-1',
      payload,
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('loads stored payloads and processes them in the worker', async () => {
    eventsRepository.getRawEventPayload.mockResolvedValue(payload);

    await processor.process({
      data: {
        rawEventId: 'raw-event-1',
        provider: 'tiktok',
        storeId: 'store-1',
        eventId: 'notification-1',
        topic: 'order_status_updated',
        reason: 'webhook',
      },
    } as never);

    expect(eventsRepository.getRawEventPayload).toHaveBeenCalledWith(
      'raw-event-1',
    );
    expect(handler.processForStore).toHaveBeenCalledWith('store-1', payload);
  });

  it('does not process when the stored payload is missing', async () => {
    eventsRepository.getRawEventPayload.mockResolvedValue(null);

    await processor.process({
      data: {
        rawEventId: 'raw-event-1',
        provider: 'tiktok',
        storeId: 'store-1',
        eventId: 'notification-1',
        topic: 'order_status_updated',
        reason: 'webhook',
      },
    } as never);

    expect(handler.processForStore).not.toHaveBeenCalled();
  });
});
