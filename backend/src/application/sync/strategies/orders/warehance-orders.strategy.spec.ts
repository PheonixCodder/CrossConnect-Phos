import { WarehanceOrdersStrategy } from './warehance-orders.strategy';

describe('WarehanceOrdersStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'warehance',
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
      getProductIdsByIdentifiers: jest.fn(),
    };
    const metricsRepo = {
      bulkUpsertMetrics: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new WarehanceOrdersStrategy(
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

  it('skips order writes when Warehance returns no orders', async () => {
    const { strategy, ordersRepo, orderItemsRepo, productsRepo } =
      createStrategy();
    const service = {
      getOrders: jest.fn().mockResolvedValue({ orders: [] }),
      getShipments: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.getOrders).toHaveBeenCalledWith('2026-06-01T00:00:00.000Z');
    expect(service.getShipments).not.toHaveBeenCalled();
    expect(productsRepo.getProductIdsByIdentifiers).not.toHaveBeenCalled();
    expect(ordersRepo.insertOrdersAndReturn).not.toHaveBeenCalled();
    expect(orderItemsRepo.bulkUpsertOrderItems).not.toHaveBeenCalled();
  });

  it('syncs Warehance orders, deduped items, fulfillments, and metrics', async () => {
    const {
      strategy,
      ordersRepo,
      orderItemsRepo,
      shipmentRepo,
      productsRepo,
      metricsRepo,
    } = createStrategy();
    const service = {
      getOrders: jest.fn().mockResolvedValue({
        orders: [
          {
            id: 101,
            fulfillment_status: 'fulfilled',
            cancelled: false,
            order_date: '2026-06-02T00:00:00.000Z',
            subtotal_amount: 20,
            shipping_amount: 2,
            tax_amount: 1,
            total_amount: 23,
            order_items: [
              {
                id: 501,
                sku: 'SKU-1',
                quantity: 2,
                quantity_shipped: 2,
                cancelled: false,
              },
              {
                id: 502,
                sku: 'SKU-1',
                quantity: 2,
                quantity_shipped: 2,
                cancelled: false,
              },
            ],
          },
        ],
      }),
      getShipments: jest.fn().mockResolvedValue({
        shipments: [
          {
            id: 701,
            voided: false,
            order: { id: 101 },
            carrier_connection: { carrier: 'UPS' },
            shipment_parcels: [
              {
                id: 801,
                tracking_number: 'TRACK-1',
                items: [{ product: { id: 901 } }],
              },
            ],
          },
        ],
      }),
    };

    productsRepo.getProductIdsByIdentifiers.mockResolvedValue(
      new Map([
        ['SKU-1', 'product-db-1'],
        ['901', 'product-db-1'],
      ]),
    );
    ordersRepo.insertOrdersAndReturn.mockResolvedValue({
      data: [
        {
          id: 'order-db-1',
          external_order_id: '101',
          ordered_at: '2026-06-02T00:00:00.000Z',
          total: 23,
        },
      ],
    });
    orderItemsRepo.bulkUpsertOrderItems.mockResolvedValue({ count: 1 });
    shipmentRepo.insertShipments.mockResolvedValue({ data: [], error: null });
    metricsRepo.bulkUpsertMetrics.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.getProductIdsByIdentifiers).toHaveBeenCalledWith(
      store.id,
      'warehance',
      {
        skus: ['SKU-1', 'SKU-1'],
        externalProductIds: ['901'],
      },
    );
    expect(ordersRepo.insertOrdersAndReturn).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'warehance',
        external_order_id: '101',
        total: 23,
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
    expect(shipmentRepo.insertShipments).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        external_fulfillment_id: '701-801',
        tracking_number: 'TRACK-1',
      }),
    ]);
    expect(metricsRepo.bulkUpsertMetrics).toHaveBeenCalled();
  });
});
