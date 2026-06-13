import { TikTokOrdersStrategy } from './tiktok-orders.strategy';

describe('TikTokOrdersStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'tiktok',
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

    const strategy = new TikTokOrdersStrategy(
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

  it('skips order writes when TikTok returns no orders', async () => {
    const { strategy, ordersRepo, orderItemsRepo, productsRepo } =
      createStrategy();
    const service = {
      getAllOrders: jest.fn().mockResolvedValue([]),
      getAllFulfillments: jest.fn(),
      getDailyGMV: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.getAllOrders).toHaveBeenCalledWith(store.id, 1780272000);
    expect(service.getAllFulfillments).not.toHaveBeenCalled();
    expect(service.getDailyGMV).not.toHaveBeenCalled();
    expect(productsRepo.getProductIdsBySkusInBatches).not.toHaveBeenCalled();
    expect(ordersRepo.insertOrdersAndReturn).not.toHaveBeenCalled();
    expect(orderItemsRepo.bulkUpsertOrderItems).not.toHaveBeenCalled();
  });

  it('syncs TikTok orders, items, fulfillments, and metrics', async () => {
    const {
      strategy,
      ordersRepo,
      orderItemsRepo,
      shipmentRepo,
      productsRepo,
      metricsRepo,
    } = createStrategy();
    const service = {
      getAllOrders: jest.fn().mockResolvedValue([
        {
          id: 'order-1',
          status: 'DELIVERED',
          paidTime: 1780397200,
          createTime: 1780397200,
          payment: {
            currency: 'USD',
            subTotal: '20',
            tax: '1',
            shippingFee: '2',
            totalAmount: '23',
            sellerDiscount: '0',
            platformDiscount: '0',
          },
          lineItems: [
            {
              id: 'line-1',
              sellerSku: 'SKU-1',
              salePrice: '20',
              originalPrice: '25',
            },
          ],
        },
      ]),
      getAllFulfillments: jest.fn().mockResolvedValue([
        {
          id: 'package-1',
          orders: [{ id: 'order-1' }],
          orderLineItemIds: ['line-1'],
          trackingNumber: 'TRACK-1',
          shippingProviderName: 'UPS',
          status: 'DELIVERED',
        },
      ]),
      getDailyGMV: jest.fn().mockResolvedValue([
        {
          startDate: '2026-06-02',
          gmv: { amount: '23' },
          orders: 1,
          unitsSold: 1,
        },
      ]),
    };

    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['SKU-1', 'product-db-1']]),
    );
    ordersRepo.insertOrdersAndReturn.mockResolvedValue({
      data: [
        {
          id: 'order-db-1',
          external_order_id: 'order-1',
          ordered_at: '2026-06-02T00:06:40.000Z',
          total: 23,
        },
      ],
    });
    orderItemsRepo.bulkUpsertOrderItems.mockResolvedValue({ count: 1 });
    shipmentRepo.insertShipments.mockResolvedValue({ data: [], error: null });
    metricsRepo.bulkUpsertMetrics.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.getProductIdsBySkusInBatches).toHaveBeenCalledWith(
      store.id,
      ['SKU-1'],
      'tiktok',
    );
    expect(ordersRepo.insertOrdersAndReturn).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'tiktok',
        external_order_id: 'order-1',
        total: 23,
      }),
    ]);
    expect(orderItemsRepo.bulkUpsertOrderItems).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        sku: 'SKU-1',
        quantity: 1,
        price: 20,
      }),
    ]);
    expect(shipmentRepo.insertShipments).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        external_fulfillment_id: 'package-1',
        external_fulfillment_line_item_id: 'line-1',
        tracking_number: 'TRACK-1',
      }),
    ]);
    expect(metricsRepo.bulkUpsertMetrics).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'tiktok',
        metric_type: 'sales',
        value: 23,
      }),
      expect.objectContaining({
        metric_type: 'orders_count',
        value: 1,
      }),
      expect.objectContaining({
        metric_type: 'units_sold',
        value: 1,
      }),
    ]);
  });
});
