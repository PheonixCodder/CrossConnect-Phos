import { TargetReturnsStrategy } from './target-returns.strategy';

describe('TargetReturnsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'target',
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

    const strategy = new TargetReturnsStrategy(
      ordersRepo as any,
      returnsRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, ordersRepo, returnsRepo, storeRepo, alertsRepo };
  }

  it('skips writes when Target returns no returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getAllProductReturns: jest.fn().mockResolvedValue([]),
    };

    await strategy.sync({ service, store });

    expect(service.getAllProductReturns).toHaveBeenCalledWith({
      since: '2026-06-01T00:00:00.000Z',
    });
    expect(ordersRepo.getByExternalOrderIds).not.toHaveBeenCalled();
    expect(returnsRepo.insertReturns).not.toHaveBeenCalled();
  });

  it('resolves external order IDs before inserting Target returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getAllProductReturns: jest.fn().mockResolvedValue([
        {
          id: 'return-1',
          order_id: 'external-order-1',
          external_id: 'SKU-1',
          tcin: 'TCIN-1',
          quantity: 1,
          return_date: '2026-06-02T00:00:00.000Z',
          return_reason: 'DAMAGED',
          created: '2026-06-02T00:00:00.000Z',
          created_by: 'target',
          last_modified: '2026-06-02T01:00:00.000Z',
          last_modified_by: 'target',
          seller_id: 'seller-1',
        },
      ]),
    };

    ordersRepo.getByExternalOrderIds.mockResolvedValue([
      {
        id: 'order-db-1',
        external_order_id: 'external-order-1',
      },
    ]);
    returnsRepo.insertReturns.mockResolvedValue({ data: [], error: null });

    await strategy.sync({ service, store });

    expect(ordersRepo.getByExternalOrderIds).toHaveBeenCalledWith(store.id, [
      'external-order-1',
    ]);
    expect(returnsRepo.insertReturns).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'target',
        external_return_id: 'return-1',
        order_id: 'order-db-1',
        status: 'DAMAGED',
      }),
    ]);
  });
});
