import { TikTokProductsStrategy } from './tiktok-products.strategy';

describe('TikTokProductsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'tiktok',
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

    const strategy = new TikTokProductsStrategy(
      productsRepo as any,
      inventoryRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, productsRepo, inventoryRepo, storeRepo, alertsRepo };
  }

  it('skips database work when TikTok returns no products', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([]),
      getProductInventories: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.getAllProducts).toHaveBeenCalledWith(store.id);
    expect(service.getProductInventories).not.toHaveBeenCalled();
    expect(productsRepo.insertProducts).not.toHaveBeenCalled();
    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });

  it('upserts changed TikTok inventory rows', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([
        {
          id: 'tiktok-product-1',
          title: 'TikTok Candle',
          status: 'ACTIVATE',
          skus: [
            {
              sellerSku: 'TIKTOK-SKU-1',
              price: { taxExclusivePrice: '11.25' },
            },
          ],
        },
      ]),
      getProductInventories: jest.fn().mockResolvedValue([
        {
          id: 'tiktok-product-1',
          skus: [
            {
              sellerSku: 'TIKTOK-SKU-1',
              totalAvailableQuantity: 4,
              totalCommittedQuantity: 1,
              warehouseInventory: [{ availableQuantity: 4 }],
            },
          ],
        },
      ]),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['TIKTOK-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({});
    inventoryRepo.updateInventoryBatch.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.insertProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'tiktok',
        sku: 'TIKTOK-SKU-1',
        title: 'TikTok Candle',
      }),
    ]);
    expect(service.getProductInventories).toHaveBeenCalledWith(store.id, [
      'tiktok-product-1',
    ]);
    expect(inventoryRepo.updateInventoryBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        product_id: 'product-db-1',
        sku: 'TIKTOK-SKU-1',
        platform_quantity: 4,
        reserved_quantity: 1,
        warehouse_quantity: 4,
      }),
    ]);
  });

  it('skips inventory update when existing TikTok inventory is unchanged', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([
        {
          id: 'tiktok-product-1',
          title: 'TikTok Candle',
          status: 'ACTIVATE',
          skus: [
            {
              sellerSku: 'TIKTOK-SKU-1',
              price: { taxExclusivePrice: '11.25' },
            },
          ],
        },
      ]),
      getProductInventories: jest.fn().mockResolvedValue([
        {
          id: 'tiktok-product-1',
          skus: [
            {
              sellerSku: 'TIKTOK-SKU-1',
              totalAvailableQuantity: 4,
              totalCommittedQuantity: 1,
              warehouseInventory: [{ availableQuantity: 4 }],
            },
          ],
        },
      ]),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['TIKTOK-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({
      'TIKTOK-SKU-1': {
        platform_quantity: 4,
        reserved_quantity: 1,
        warehouse_quantity: 4,
        inventory_status: 'in_stock',
      },
    });

    await strategy.sync({ service, store });

    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });
});
