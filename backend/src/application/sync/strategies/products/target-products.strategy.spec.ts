import { TargetProductsStrategy } from './target-products.strategy';

describe('TargetProductsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'target',
    last_products_synced_at: '2026-01-01T00:00:00.000Z',
  } as any;

  function createStrategy() {
    const productsRepo = {
      insertProducts: jest.fn(),
      getProductIdsBySkusInBatches: jest.fn(),
    };
    const inventoryRepo = {
      updateInventoryBatch: jest.fn(),
    };
    const storeRepo = {
      updateStoreHealth: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new TargetProductsStrategy(
      productsRepo as any,
      inventoryRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, productsRepo, inventoryRepo, storeRepo, alertsRepo };
  }

  it('passes the store product cursor and skips work when Target returns no products', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([]),
    };

    await strategy.sync({ service, store });

    expect(service.getAllProducts).toHaveBeenCalledWith(
      '2026-01-01T00:00:00.000Z',
    );
    expect(productsRepo.insertProducts).not.toHaveBeenCalled();
    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });

  it('upserts mapped products and inventory rows', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const targetProduct = {
      id: 'target-product-1',
      external_id: 'TARGET-SKU-1',
      created: '2026-01-01T00:00:00.000Z',
      last_modified: '2026-01-02T00:00:00.000Z',
      fields: [
        { name: 'title', value: 'Target Candle' },
        { name: 'description', value: 'Scented' },
      ],
      price: { list_price: 20, offer_price: 18 },
      product_statuses: [
        { id: 'status-1', listing_status: 'APPROVED', current: true },
      ],
      quantities: [{ quantity: 6 }],
    } as any;
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([targetProduct]),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['TARGET-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.updateInventoryBatch.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.insertProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'target',
        sku: 'TARGET-SKU-1',
        title: 'Target Candle',
      }),
    ]);
    expect(inventoryRepo.updateInventoryBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        product_id: 'product-db-1',
        sku: 'TARGET-SKU-1',
        platform_quantity: 6,
      }),
    ]);
  });
});
