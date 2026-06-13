import { AmazonReturnsStrategy } from './amazon-returns.strategy';

describe('AmazonReturnsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'amazon',
    last_returns_synced_at: '2026-06-01T00:00:00.000Z',
  } as any;

  function createStrategy() {
    const ordersRepo = {
      getByExternalOrderIds: jest.fn(),
    };
    const returnsRepo = {
      insertReturns: jest.fn(),
    };
    const storeRepo = {
      updateStoreHealth: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new AmazonReturnsStrategy(
      ordersRepo as any,
      returnsRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, ordersRepo, returnsRepo, storeRepo, alertsRepo };
  }

  it('skips writes when Amazon returns no returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getReturns: jest.fn().mockResolvedValue([]),
    };

    await strategy.sync({ service, store });

    expect(service.getReturns).toHaveBeenCalledWith(
      store,
      '2026-06-01T00:00:00.000Z',
    );
    expect(ordersRepo.getByExternalOrderIds).not.toHaveBeenCalled();
    expect(returnsRepo.insertReturns).not.toHaveBeenCalled();
  });

  it('resolves external order IDs before inserting Amazon returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getReturns: jest.fn().mockResolvedValue([
        {
          return_date: '2026-06-02T00:00:00.000Z',
          order_id: 'amazon-order-1',
          sku: 'SKU-1',
          asin: 'ASIN-1',
          quantity: 1,
          status: 'Unit returned to inventory',
          license_plate_number: 'LPN-1',
        },
      ]),
    };

    ordersRepo.getByExternalOrderIds.mockResolvedValue([
      {
        id: 'order-db-1',
        external_order_id: 'amazon-order-1',
      },
    ]);
    returnsRepo.insertReturns.mockResolvedValue({ data: [], error: null });

    await strategy.sync({ service, store });

    expect(ordersRepo.getByExternalOrderIds).toHaveBeenCalledWith(store.id, [
      'amazon-order-1',
    ]);
    expect(returnsRepo.insertReturns).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'amazon',
        external_return_id: 'LPN-1',
        order_id: 'order-db-1',
        status: 'Unit returned to inventory',
        refund_amount: null,
        currency: 'USD',
      }),
    ]);
  });
});
