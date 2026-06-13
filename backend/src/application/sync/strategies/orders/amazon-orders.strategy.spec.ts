import { AmazonOrdersStrategy } from './amazon-orders.strategy';

describe('AmazonOrdersStrategy', () => {
  const baseStore = {
    id: 'store-1',
    platform: 'amazon',
  } as any;

  function createStrategy() {
    const ordersRepo = {
      syncOrderData: jest.fn(),
    };
    const storeRepo = {
      updateSyncTimestamps: jest.fn(),
    };
    const productsRepo = {
      getProductIdsByIdentifiers: jest.fn(),
    };
    const metricsRepo = {
      bulkUpsertMetrics: jest.fn(),
    };

    const strategy = new AmazonOrdersStrategy(
      ordersRepo as any,
      storeRepo as any,
      productsRepo as any,
      metricsRepo as any,
    );

    return { strategy, ordersRepo, storeRepo, productsRepo, metricsRepo };
  }

  it('syncs first-run Amazon flat-file report rows through the order RPC', async () => {
    const { strategy, ordersRepo, storeRepo, productsRepo, metricsRepo } =
      createStrategy();
    const service = {
      getOrdersFlatFileReport: jest.fn().mockResolvedValue([
        {
          'amazon-order-id': 'amazon-order-1',
          asin: 'ASIN-1',
          sku: 'SKU-1',
          'purchase-date': '2026-06-01T00:00:00.000Z',
          currency: 'USD',
          'item-price': '12',
          'item-tax': '1',
          'shipping-price': '2',
          quantity: '2',
          'order-status': 'Shipped',
          'item-status': 'Shipped',
        },
      ]),
      getDailySalesDataKiosk: jest.fn().mockResolvedValue([
        {
          startDate: '2026-06-01',
          sales: {
            orderedProductSales: { amount: 15 },
            totalOrderItems: 1,
            unitsOrdered: 2,
          },
        },
      ]),
    };

    productsRepo.getProductIdsByIdentifiers.mockResolvedValue(
      new Map([
        ['ASIN-1', 'product-db-1'],
        ['SKU-1', 'product-db-1'],
      ]),
    );
    ordersRepo.syncOrderData.mockResolvedValue(undefined);
    metricsRepo.bulkUpsertMetrics.mockResolvedValue(undefined);
    storeRepo.updateSyncTimestamps.mockResolvedValue(undefined);

    await strategy.sync({ service, store: baseStore });

    expect(service.getOrdersFlatFileReport).toHaveBeenCalledWith(baseStore);
    expect(productsRepo.getProductIdsByIdentifiers).toHaveBeenCalledWith(
      baseStore.id,
      'amazon',
      {
        asins: ['ASIN-1'],
        skus: ['SKU-1'],
      },
    );
    expect(ordersRepo.syncOrderData).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          store_id: baseStore.id,
          platform: 'amazon',
          external_order_id: 'amazon-order-1',
          total: 15,
        }),
      ],
      [
        expect.objectContaining({
          order_id: 'amazon-order-1',
          external_order_id: 'amazon-order-1',
          product_id: 'product-db-1',
          sku: 'SKU-1',
          quantity: 2,
        }),
      ],
      [],
    );
    expect(metricsRepo.bulkUpsertMetrics).toHaveBeenCalled();
    expect(storeRepo.updateSyncTimestamps).toHaveBeenCalledWith(
      baseStore.id,
      'orders',
      expect.any(String),
    );
  });

  it('syncs incremental Amazon orders, items, shipments, and cursor', async () => {
    const { strategy, ordersRepo, storeRepo, productsRepo } = createStrategy();
    const store = {
      ...baseStore,
      last_orders_synced_at: '2026-06-01T00:00:00.000Z',
    };
    const service = {
      getOrders: jest.fn().mockResolvedValue([
        {
          AmazonOrderId: 'amazon-order-2',
          PurchaseDate: '2026-06-02T00:00:00.000Z',
          LastUpdateDate: '2026-06-02T01:00:00.000Z',
          OrderStatus: 'Shipped',
          FulfillmentChannel: 'AFN',
          OrderTotal: { Amount: '20', CurrencyCode: 'USD' },
        },
      ]),
      getOrderItems: jest.fn().mockResolvedValue([
        {
          OrderItemId: 'item-1',
          ASIN: 'ASIN-1',
          SellerSKU: 'SKU-1',
          QuantityOrdered: 2,
          QuantityShipped: 2,
          ItemPrice: { Amount: '20', CurrencyCode: 'USD' },
          ShippingPrice: { Amount: '0', CurrencyCode: 'USD' },
        },
      ]),
      getDailySalesDataKiosk: jest.fn().mockResolvedValue([]),
    };

    productsRepo.getProductIdsByIdentifiers.mockResolvedValue(
      new Map([
        ['ASIN-1', 'product-db-1'],
        ['SKU-1', 'product-db-1'],
      ]),
    );
    ordersRepo.syncOrderData.mockResolvedValue(undefined);
    storeRepo.updateSyncTimestamps.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(service.getOrders).toHaveBeenCalledWith(
      store,
      '2026-06-01T00:00:00.000Z',
    );
    expect(service.getOrderItems).toHaveBeenCalledWith('amazon-order-2');
    expect(productsRepo.getProductIdsByIdentifiers).toHaveBeenCalledWith(
      store.id,
      'amazon',
      {
        asins: ['ASIN-1'],
        skus: ['SKU-1'],
      },
    );
    expect(ordersRepo.syncOrderData).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          store_id: store.id,
          platform: 'amazon',
          external_order_id: 'amazon-order-2',
          total: 20,
        }),
      ],
      [
        expect.objectContaining({
          order_id: 'amazon-order-2',
          external_order_id: 'amazon-order-2',
          product_id: 'product-db-1',
          sku: 'SKU-1',
          quantity: 2,
          fulfilled_quantity: 2,
        }),
      ],
      [
        expect.objectContaining({
          store_id: store.id,
          platform: 'amazon',
          order_id: 'amazon-order-2',
          external_order_id: 'amazon-order-2',
          product_id: 'product-db-1',
          external_fulfillment_id: 'amazon-order-2_item-1',
        }),
      ],
    );
    expect(storeRepo.updateSyncTimestamps).toHaveBeenCalledWith(
      store.id,
      'orders',
      expect.any(String),
    );
  }, 10000);
});
