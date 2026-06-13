import { TikTokReturnsStrategy } from './tiktok-returns.strategy';

describe('TikTokReturnsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'tiktok',
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

    const strategy = new TikTokReturnsStrategy(
      ordersRepo as any,
      returnsRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, ordersRepo, returnsRepo, storeRepo, alertsRepo };
  }

  it('skips writes when TikTok returns no returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getAllReturns: jest.fn().mockResolvedValue([]),
    };

    await strategy.sync({ service, store });

    expect(service.getAllReturns).toHaveBeenCalledWith(store.id, 1780272000);
    expect(ordersRepo.getByExternalOrderIds).not.toHaveBeenCalled();
    expect(returnsRepo.insertReturns).not.toHaveBeenCalled();
  });

  it('resolves external order IDs before inserting TikTok returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getAllReturns: jest.fn().mockResolvedValue([
        {
          returnId: 'return-1',
          orderId: 'external-order-1',
          returnStatus: 'RETURN_OR_REFUND_REQUEST_SUCCESS',
          refundAmount: {
            refundTotal: '12.50',
            currency: 'USD',
          },
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
        platform: 'tiktok',
        external_return_id: 'return-1',
        order_id: 'order-db-1',
        status: 'RETURN_OR_REFUND_REQUEST_SUCCESS',
        refund_amount: 12.5,
        currency: 'USD',
      }),
    ]);
  });
});
