import { TasksService } from './sync-scheduler.service';
import { StoreRow } from '../sync.types';

function createQueue() {
  return {
    add: jest.fn().mockResolvedValue(undefined),
    clean: jest.fn().mockResolvedValue(undefined),
  };
}

const shopifyStore = {
  id: 'store-1',
  org_id: 'org-1',
  platform: 'shopify',
  last_products_synced_at: '2026-06-01T10:00:00.000Z',
  last_orders_synced_at: '2026-06-02T10:00:00.000Z',
  last_returns_synced_at: '2026-06-03T10:00:00.000Z',
} as StoreRow;

const faireStore = {
  ...shopifyStore,
  id: 'store-2',
  platform: 'faire',
} as StoreRow;

describe('TasksService', () => {
  it('queues metadata-only scheduled sync payloads with deterministic ids', async () => {
    const productsQueue = createQueue();
    const ordersQueue = createQueue();
    const returnsQueue = createQueue();
    const storesRepository = {
      storesAsQueued: jest.fn().mockResolvedValue({ error: null }),
      updateStoreHealth: jest.fn(),
    };
    const storeCredentialsService = {
      getActiveStoresWithCredentials: jest.fn().mockResolvedValue([
        {
          store: shopifyStore,
          credentials: { encrypted: true },
        },
      ]),
    };
    const alertsRepository = { createAlert: jest.fn() };

    const service = new TasksService(
      productsQueue as any,
      ordersQueue as any,
      returnsQueue as any,
      storesRepository as any,
      storeCredentialsService as any,
      alertsRepository as any,
    );

    await service.pollAllActiveStores();

    expect(productsQueue.add).toHaveBeenCalledWith(
      'shopify.products',
      expect.objectContaining({
        storeId: 'store-1',
        platform: 'shopify',
        orgId: 'org-1',
        domain: 'products',
        since: '2026-06-01T10:00:00.000Z',
        reason: 'scheduled',
      }),
      expect.objectContaining({
        jobId: 'sync-products-store-1-2026-06-01T10-00-00.000Z',
      }),
    );
    expect(productsQueue.add.mock.calls[0][1]).not.toHaveProperty(
      'credentials',
    );
    expect(ordersQueue.add.mock.calls[0][1]).not.toHaveProperty('credentials');
    expect(returnsQueue.add.mock.calls[0][1]).not.toHaveProperty(
      'credentials',
    );
  });

  it('does not queue returns for unsupported platforms', async () => {
    const productsQueue = createQueue();
    const ordersQueue = createQueue();
    const returnsQueue = createQueue();
    const storesRepository = {
      storesAsQueued: jest.fn().mockResolvedValue({ error: null }),
      updateStoreHealth: jest.fn(),
    };
    const storeCredentialsService = {
      getActiveStoresWithCredentials: jest.fn().mockResolvedValue([
        {
          store: faireStore,
          credentials: { encrypted: true },
        },
      ]),
    };
    const alertsRepository = { createAlert: jest.fn() };

    const service = new TasksService(
      productsQueue as any,
      ordersQueue as any,
      returnsQueue as any,
      storesRepository as any,
      storeCredentialsService as any,
      alertsRepository as any,
    );

    await service.pollAllActiveStores();

    expect(productsQueue.add).toHaveBeenCalledTimes(1);
    expect(ordersQueue.add).toHaveBeenCalledTimes(1);
    expect(returnsQueue.add).not.toHaveBeenCalled();
  });
});

