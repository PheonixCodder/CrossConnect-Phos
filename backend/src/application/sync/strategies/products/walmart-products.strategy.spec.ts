import { WalmartProductsStrategy } from './walmart-products.strategy';

describe('WalmartProductsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'walmart',
  } as any;

  function createStrategy() {
    const productsRepo = {
      insertProducts: jest.fn(),
      getProductIdsBySkusInBatches: jest.fn(),
    };
    const inventoryRepo = {
      getBySkus: jest.fn(),
      updateInventoryBatch: jest.fn(),
    };
    const storeRepo = {
      updateStoreHealth: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new WalmartProductsStrategy(
      productsRepo as any,
      inventoryRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, productsRepo, inventoryRepo, storeRepo, alertsRepo };
  }

  it('skips database work when Walmart returns no products', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getProducts: jest.fn().mockResolvedValue([]),
      getInventory: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.getProducts).toHaveBeenCalled();
    expect(service.getInventory).not.toHaveBeenCalled();
    expect(productsRepo.insertProducts).not.toHaveBeenCalled();
    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });

  it('upserts changed Walmart inventory rows', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getProducts: jest.fn().mockResolvedValue([
        {
          sku: 'WALMART-SKU-1',
          wpid: 'wpid-1',
          gtin: 'gtin-1',
          productName: 'Walmart Candle',
          price: { amount: 15, currency: 'USD' },
          publishedStatus: 'PUBLISHED',
          lifecycleStatus: 'ACTIVE',
        },
      ]),
      getInventory: jest.fn().mockResolvedValue({
        sku: 'WALMART-SKU-1',
        quantity: { unit: 'EACH', amount: 12 },
      }),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['WALMART-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({});
    inventoryRepo.updateInventoryBatch.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.insertProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'walmart',
        sku: 'WALMART-SKU-1',
      }),
    ]);
    expect(service.getInventory).toHaveBeenCalledWith(
      expect.objectContaining({ sku: 'WALMART-SKU-1' }),
    );
    expect(inventoryRepo.updateInventoryBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        product_id: 'product-db-1',
        sku: 'WALMART-SKU-1',
        platform_quantity: 12,
      }),
    ]);
  });

  it('skips inventory update when existing inventory is unchanged', async () => {
    const { strategy, inventoryRepo, productsRepo } = createStrategy();
    const service = {
      getProducts: jest.fn().mockResolvedValue([
        {
          sku: 'WALMART-SKU-1',
          wpid: 'wpid-1',
          gtin: 'gtin-1',
          productName: 'Walmart Candle',
          price: { amount: 15, currency: 'USD' },
          publishedStatus: 'PUBLISHED',
          lifecycleStatus: 'ACTIVE',
        },
      ]),
      getInventory: jest.fn().mockResolvedValue({
        sku: 'WALMART-SKU-1',
        quantity: { unit: 'EACH', amount: 12 },
      }),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['WALMART-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({
      'WALMART-SKU-1': {
        platform_quantity: 12,
        inventory_status: 'in_stock',
      },
    });

    await strategy.sync({ service, store });

    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });
});
