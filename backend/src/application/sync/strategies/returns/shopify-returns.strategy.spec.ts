import { ShopifyReturnsStrategy } from './shopify-returns.strategy';

describe('ShopifyReturnsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'shopify',
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
      updateSyncTimestamps: jest.fn(),
    };

    const strategy = new ShopifyReturnsStrategy(
      ordersRepo as any,
      returnsRepo as any,
      storeRepo as any,
    );

    return { strategy, ordersRepo, returnsRepo, storeRepo };
  }

  it('skips writes when Shopify returns no returns', async () => {
    const { strategy, ordersRepo, returnsRepo, storeRepo } = createStrategy();
    const service = {
      fetchReturns: jest.fn().mockResolvedValue([]),
    };

    await strategy.sync({ service, store });

    expect(service.fetchReturns).toHaveBeenCalledWith(
      '2026-06-01T00:00:00.000Z',
    );
    expect(ordersRepo.getByExternalOrderIds).not.toHaveBeenCalled();
    expect(returnsRepo.insertReturns).not.toHaveBeenCalled();
    expect(storeRepo.updateSyncTimestamps).not.toHaveBeenCalled();
  });

  it('dedupes and inserts Shopify returns with internal order IDs', async () => {
    const { strategy, ordersRepo, returnsRepo, storeRepo } = createStrategy();
    const service = {
      fetchReturns: jest.fn().mockResolvedValue([
        {
          node: {
            id: 'gid://shopify/Order/1',
            currencyCode: 'USD',
            returns: {
              nodes: [
                {
                  id: 'gid://shopify/Return/1',
                  status: 'OPEN',
                },
                {
                  id: 'gid://shopify/Return/1',
                  status: 'OPEN',
                },
              ],
            },
            refunds: [
              {
                totalRefundedSet: {
                  shopMoney: {
                    amount: '12.50',
                  },
                },
              },
            ],
          },
        },
      ]),
    };

    ordersRepo.getByExternalOrderIds.mockResolvedValue([
      {
        id: 'order-db-1',
        external_order_id: 'gid://shopify/Order/1',
      },
    ]);
    returnsRepo.insertReturns.mockResolvedValue({ data: [], error: null });
    storeRepo.updateSyncTimestamps.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(ordersRepo.getByExternalOrderIds).toHaveBeenCalledWith(store.id, [
      'gid://shopify/Order/1',
    ]);
    expect(returnsRepo.insertReturns).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'shopify',
        external_return_id: 'gid://shopify/Return/1',
        order_id: 'order-db-1',
        status: 'open',
        currency: 'USD',
        refund_amount: 0,
      }),
    ]);
    expect(storeRepo.updateSyncTimestamps).toHaveBeenCalledWith(
      store.id,
      'returns',
      expect.any(String),
    );
  });
});
