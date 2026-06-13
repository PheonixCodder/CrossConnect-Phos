import { FaireOrdersStrategy } from './faire-orders.strategy';

describe('FaireOrdersStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'faire',
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
      getAllProductsByStore: jest.fn(),
    };
    const metricsRepo = {
      bulkUpsertMetrics: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new FaireOrdersStrategy(
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

  it('skips order writes when Faire returns no orders', async () => {
    const { strategy, ordersRepo, orderItemsRepo, productsRepo } =
      createStrategy();
    const service = {
      getAllOrders: jest.fn().mockResolvedValue([]),
    };

    productsRepo.getAllProductsByStore.mockResolvedValue([]);

    await strategy.sync({ service, store });

    expect(productsRepo.getAllProductsByStore).toHaveBeenCalledWith(store.id);
    expect(service.getAllOrders).toHaveBeenCalled();
    expect(ordersRepo.insertOrdersAndReturn).not.toHaveBeenCalled();
    expect(orderItemsRepo.bulkUpsertOrderItems).not.toHaveBeenCalled();
  });

  it('syncs Faire orders, remaps IDs, and upserts metrics', async () => {
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
          id: 'order-ext-1',
          state: 'NEW',
          created_at: '2026-06-01T00:00:00.000Z',
          updated_at: '2026-06-01T00:00:00.000Z',
          items: [
            {
              id: 'line-ext-1',
              product_id: 'product-ext-1',
              sku: 'SKU-1',
              quantity: 2,
              price_cents: 1500,
            },
          ],
          shipments: [
            {
              id: 'shipment-ext-1',
              carrier: 'UPS',
              tracking_code: 'TRACK-1',
              created_at: '2026-06-02T00:00:00.000Z',
              updated_at: '2026-06-02T00:00:00.000Z',
            },
          ],
        },
      ]),
    };

    productsRepo.getAllProductsByStore.mockResolvedValue([
      {
        id: 'product-db-1',
        external_product_id: 'product-ext-1',
      },
    ]);
    ordersRepo.insertOrdersAndReturn.mockResolvedValue({
      data: [
        {
          id: 'order-db-1',
          external_order_id: 'order-ext-1',
          ordered_at: '2026-06-01T00:00:00.000Z',
          total: 30,
        },
      ],
    });
    orderItemsRepo.bulkUpsertOrderItems.mockResolvedValue({ count: 1 });
    shipmentRepo.insertShipments.mockResolvedValue({ data: [], error: null });
    metricsRepo.bulkUpsertMetrics.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(ordersRepo.insertOrdersAndReturn).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'faire',
        external_order_id: 'order-ext-1',
        total: 30,
      }),
    ]);
    expect(orderItemsRepo.bulkUpsertOrderItems).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        sku: 'SKU-1',
        quantity: 2,
        total: 30,
      }),
    ]);
    expect(shipmentRepo.insertShipments).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 'order-db-1',
        product_id: 'product-db-1',
        external_fulfillment_id: 'shipment-ext-1',
        tracking_number: 'TRACK-1',
      }),
    ]);
    expect(metricsRepo.bulkUpsertMetrics).toHaveBeenCalled();
  });
});
