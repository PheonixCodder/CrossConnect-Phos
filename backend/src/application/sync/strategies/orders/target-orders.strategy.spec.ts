import { TargetOrdersStrategy } from './target-orders.strategy';

describe('TargetOrdersStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'target',
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

    const strategy = new TargetOrdersStrategy(
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

  it('skips order writes when Target returns no orders', async () => {
    const { strategy, ordersRepo, orderItemsRepo, productsRepo } =
      createStrategy();
    const service = {
      getAllOrders: jest.fn().mockResolvedValue([]),
      getOrderFulfillments: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.getAllOrders).toHaveBeenCalledWith({
      since: '2026-06-01T00:00:00.000Z',
    });
    expect(service.getOrderFulfillments).not.toHaveBeenCalled();
    expect(productsRepo.getProductIdsBySkusInBatches).not.toHaveBeenCalled();
    expect(ordersRepo.insertOrdersAndReturn).not.toHaveBeenCalled();
    expect(orderItemsRepo.bulkUpsertOrderItems).not.toHaveBeenCalled();
  });

  it('syncs Target orders, items, fulfillments, and metrics', async () => {
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
          id: 'target-order-1',
          status: 'SHIPPED',
          currency: 'USD',
          order_date: '2026-06-02T00:00:00.000Z',
          order_number: '1001',
          seller_id: 'seller-1',
          ship_advice_number: 'ship-advice-1',
          created: '2026-06-02T00:00:00.000Z',
          last_modified: '2026-06-03T00:00:00.000Z',
          order_lines: [
            {
              external_id: 'SKU-1',
              order_line_number: '1',
              order_line_statuses: [{ status: 'SHIPPED', quantity: 2 }],
              quantity: 2,
              unit_price: 12,
              total_price: 24,
              total_shipping_price: 4,
            },
          ],
        },
      ]),
      getOrderFulfillments: jest.fn().mockResolvedValue([
        {
          id: 'fulfillment-1',
          order_id: 'target-order-1',
          order_line_number: '1',
          quantity: 2,
          shipping_method: 'UPS',
          tracking_number: 'TRACK-1',
          created: '2026-06-03T00:00:00.000Z',
          last_modified: '2026-06-03T00:00:00.000Z',
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
          external_order_id: 'target-order-1',
          ordered_at: '2026-06-02T00:00:00.000Z',
          total: 28,
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
      'target',
    );
    expect(ordersRepo.insertOrdersAndReturn).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'target',
        external_order_id: 'target-order-1',
        total: 28,
      }),
    ]);
    expect(orderItemsRepo.bulkUpsertOrderItems).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        sku: 'SKU-1',
        quantity: 2,
        fulfilled_quantity: 2,
      }),
    ]);
    expect(service.getOrderFulfillments).toHaveBeenCalledWith('target-order-1');
    expect(shipmentRepo.insertShipments).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        external_fulfillment_id: 'fulfillment-1',
        tracking_number: 'TRACK-1',
      }),
    ]);
    expect(metricsRepo.bulkUpsertMetrics).toHaveBeenCalled();
  });
});
