import { ShopifyOrdersStrategy } from './shopify-orders.strategy';

describe('ShopifyOrdersStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'shopify',
    last_orders_synced_at: '2026-06-01T00:00:00.000Z',
  } as any;

  function createStrategy() {
    const ordersRepo = {
      insertOrdersAndReturn: jest.fn(),
    };
    const orderItemsRepo = {
      bulkUpsertOrderItems: jest.fn(),
    };
    const shipmentRepo = {
      insertShipments: jest.fn(),
    };
    const storeRepo = {
      updateStoreHealth: jest.fn(),
    };
    const productsRepo = {
      getProductIdsBySkusInBatches: jest.fn(),
    };
    const metricsRepo = {
      bulkUpsertMetrics: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new ShopifyOrdersStrategy(
      ordersRepo as any,
      orderItemsRepo as any,
      shipmentRepo as any,
      storeRepo as any,
      productsRepo as any,
      metricsRepo as any,
      alertsRepo as any,
    );

    return {
      strategy,
      ordersRepo,
      orderItemsRepo,
      shipmentRepo,
      storeRepo,
      productsRepo,
      metricsRepo,
      alertsRepo,
    };
  }

  it('skips order writes when Shopify returns no orders', async () => {
    const { strategy, ordersRepo, orderItemsRepo, productsRepo } =
      createStrategy();
    const service = {
      fetchOrders: jest.fn().mockResolvedValue([]),
      fetchFulfillments: jest.fn(),
      fetchDailyMetrics: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.fetchOrders).toHaveBeenCalledWith(
      '2026-06-01T00:00:00.000Z',
    );
    expect(service.fetchFulfillments).not.toHaveBeenCalled();
    expect(service.fetchDailyMetrics).not.toHaveBeenCalled();
    expect(productsRepo.getProductIdsBySkusInBatches).not.toHaveBeenCalled();
    expect(ordersRepo.insertOrdersAndReturn).not.toHaveBeenCalled();
    expect(orderItemsRepo.bulkUpsertOrderItems).not.toHaveBeenCalled();
  });

  it('syncs Shopify orders, items, fulfillments, and metrics', async () => {
    const {
      strategy,
      ordersRepo,
      orderItemsRepo,
      shipmentRepo,
      productsRepo,
      metricsRepo,
    } = createStrategy();
    const service = {
      fetchOrders: jest.fn().mockResolvedValue([
        {
          id: 'gid://shopify/Order/1',
          cancelReason: null,
          canMarkAsPaid: false,
          currencyCode: 'USD',
          createdAt: '2026-06-02T00:00:00.000Z',
          subtotalPriceSet: { shopMoney: { amount: '20' } },
          totalTaxSet: { shopMoney: { amount: '1' } },
          totalPriceSet: { shopMoney: { amount: '21' } },
          lineItems: {
            nodes: [
              {
                id: 'gid://shopify/LineItem/1',
                sku: 'SKU-1',
                quantity: 2,
                originalUnitPriceSet: { shopMoney: { amount: '10' } },
              },
            ],
          },
        },
      ]),
      fetchFulfillments: jest.fn().mockResolvedValue([
        {
          id: 'gid://shopify/Order/1',
          fulfillments: [
            {
              id: 'gid://shopify/Fulfillment/1',
              status: 'SUCCESS',
              trackingInfo: [{ company: 'UPS', number: 'TRACK-1' }],
              fulfillmentLineItems: {
                nodes: [
                  {
                    id: 'gid://shopify/FulfillmentLineItem/1',
                    lineItem: {
                      sku: 'SKU-1',
                      product: { id: 'gid://shopify/Product/123' },
                    },
                  },
                ],
              },
            },
          ],
        },
      ]),
      fetchDailyMetrics: jest.fn().mockResolvedValue({
        columns: [
          { name: 'day', dataType: 'DAY', displayName: 'Day' },
          {
            name: 'gross_sales',
            dataType: 'MONEY',
            displayName: 'Gross sales',
          },
          { name: 'orders', dataType: 'INTEGER', displayName: 'Orders' },
          {
            name: 'units_sold',
            dataType: 'INTEGER',
            displayName: 'Units sold',
          },
        ],
        rows: [
          {
            day: '2026-06-02',
            gross_sales: 21,
            orders: 1,
            units_sold: 2,
          },
        ],
      }),
    };

    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([
        ['SKU-1', 'product-db-1'],
        ['shopify-123-SKU-1', 'product-db-fulfillment'],
      ]),
    );
    ordersRepo.insertOrdersAndReturn.mockResolvedValue({
      data: [
        {
          id: 'order-db-1',
          external_order_id: 'gid://shopify/Order/1',
          ordered_at: '2026-06-02T00:00:00.000Z',
          total: 21,
        },
      ],
    });
    orderItemsRepo.bulkUpsertOrderItems.mockResolvedValue({ count: 1 });
    shipmentRepo.insertShipments.mockResolvedValue({ data: [], error: null });
    metricsRepo.bulkUpsertMetrics.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.getProductIdsBySkusInBatches).toHaveBeenCalledWith(
      store.id,
      ['SKU-1', 'shopify-123-SKU-1'],
      'shopify',
    );
    expect(ordersRepo.insertOrdersAndReturn).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'shopify',
        external_order_id: 'gid://shopify/Order/1',
        total: 21,
      }),
    ]);
    expect(orderItemsRepo.bulkUpsertOrderItems).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        sku: 'SKU-1',
        quantity: 2,
      }),
    ]);
    expect(shipmentRepo.insertShipments).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-fulfillment',
        external_fulfillment_id: 'gid://shopify/Fulfillment/1',
        tracking_number: 'TRACK-1',
      }),
    ]);
    expect(metricsRepo.bulkUpsertMetrics).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'shopify',
        metric_type: 'sales',
        value: 21,
      }),
      expect.objectContaining({
        metric_type: 'orders_count',
        value: 1,
      }),
      expect.objectContaining({
        metric_type: 'units_sold',
        value: 2,
      }),
    ]);
  });
});
