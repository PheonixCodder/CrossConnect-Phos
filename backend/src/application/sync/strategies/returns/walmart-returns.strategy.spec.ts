import { WalmartReturnsStrategy } from './walmart-returns.strategy';

describe('WalmartReturnsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'walmart',
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

    const strategy = new WalmartReturnsStrategy(
      ordersRepo as any,
      returnsRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, ordersRepo, returnsRepo, storeRepo, alertsRepo };
  }

  it('skips writes when Walmart returns no returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getWalmartProductReturns: jest.fn().mockResolvedValue([]),
    };

    await strategy.sync({ service, store });

    expect(service.getWalmartProductReturns).toHaveBeenCalledWith(
      '2026-06-01T00:00:00.000Z',
    );
    expect(ordersRepo.getByExternalOrderIds).not.toHaveBeenCalled();
    expect(returnsRepo.insertReturns).not.toHaveBeenCalled();
  });

  it('resolves external order IDs before inserting Walmart returns', async () => {
    const { strategy, ordersRepo, returnsRepo } = createStrategy();
    const service = {
      getWalmartProductReturns: jest.fn().mockResolvedValue([
        {
          returnOrderId: 'return-1',
          customerOrderId: 'external-order-1',
          totalRefundAmount: {
            currencyAmount: 12.5,
            currencyUnit: 'USD',
          },
          returnLineGroups: [{ returnExpectedFlag: false }],
          returnOrderLines: [
            {
              purchaseOrderId: 'external-order-1',
            },
          ],
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
        platform: 'walmart',
        external_return_id: 'return-1',
        order_id: 'order-db-1',
        refund_amount: 12.5,
        currency: 'USD',
        status: 'refunded',
      }),
    ]);
  });
});
