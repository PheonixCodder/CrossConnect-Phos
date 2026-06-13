import { WalmartOrdersStrategy } from './walmart-orders.strategy';

describe('WalmartOrdersStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'walmart',
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

    const strategy = new WalmartOrdersStrategy(
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

  it('skips order writes when Walmart returns no orders', async () => {
    const { strategy, ordersRepo, orderItemsRepo, productsRepo } =
      createStrategy();
    const service = {
      getOrders: jest.fn().mockResolvedValue([]),
    };

    await strategy.sync({ service, store });

    expect(service.getOrders).toHaveBeenCalledWith('2026-06-01T00:00:00.000Z');
    expect(productsRepo.getProductIdsBySkusInBatches).not.toHaveBeenCalled();
    expect(ordersRepo.insertOrdersAndReturn).not.toHaveBeenCalled();
    expect(orderItemsRepo.bulkUpsertOrderItems).not.toHaveBeenCalled();
  });

  it('syncs Walmart orders, items, fulfillments, and metrics', async () => {
    const {
      strategy,
      ordersRepo,
      orderItemsRepo,
      shipmentRepo,
      productsRepo,
      metricsRepo,
    } = createStrategy();
    const service = {
      getOrders: jest.fn().mockResolvedValue([
        {
          purchaseOrderId: 'walmart-order-1',
          customerOrderId: 'customer-order-1',
          customerEmailId: 'buyer@example.com',
          customerRfc: '',
          orderDate: Date.parse('2026-06-02T00:00:00.000Z'),
          orderSummary: {
            totalAmount: { amount: 24, currency: 'USD' },
            orderSubTotals: [],
          },
          shippingInfo: {} as any,
          orderLines: {
            orderLine: [
              {
                lineNumber: '1',
                item: {
                  productName: 'Walmart Candle',
                  sku: 'SKU-1',
                },
                charges: {
                  charge: [
                    {
                      chargeType: 'PRODUCT',
                      chargeName: 'Product',
                      chargeAmount: { amount: 12, currency: 'USD' },
                      tax: { taxAmount: { amount: 0, currency: 'USD' } },
                    },
                  ],
                },
                orderLineQuantity: {
                  unitOfMeasurement: 'EACH',
                  amount: 2,
                },
                orderLineStatuses: {
                  orderLineStatus: [
                    {
                      status: 'Shipped',
                      statusQuantity: {
                        unitOfMeasurement: 'EACH',
                        amount: 2,
                      },
                      trackingInfo: {
                        carrierName: {
                          otherCarrier: '',
                          carrier: 'UPS',
                        },
                        trackingNumber: 'TRACK-1',
                        methodCode: 'Standard',
                        shipmentNo: 'SHIP-1',
                      },
                      cancellationReason: '',
                    },
                  ],
                },
                fulfillment: {} as any,
              },
            ],
          },
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
          external_order_id: 'walmart-order-1',
          ordered_at: '2026-06-02T00:00:00.000Z',
          total: 12,
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
      'walmart',
    );
    expect(ordersRepo.insertOrdersAndReturn).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'walmart',
        external_order_id: 'walmart-order-1',
        total: 12,
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
        external_fulfillment_id: 'order-db-1-1',
        tracking_number: 'TRACK-1',
      }),
    ]);
    expect(metricsRepo.bulkUpsertMetrics).toHaveBeenCalled();
  });
});
