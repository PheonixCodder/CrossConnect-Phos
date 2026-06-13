import { AmazonProductsStrategy } from './amazon-products.strategy';

describe('AmazonProductsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'amazon',
    last_products_synced_at: '2026-01-01T00:00:00.000Z',
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
      updateSyncTimestamps: jest.fn(),
    };

    const strategy = new AmazonProductsStrategy(
      productsRepo as any,
      inventoryRepo as any,
      storeRepo as any,
    );

    return { strategy, productsRepo, inventoryRepo, storeRepo };
  }

  it('skips downstream work when Amazon returns no listings', async () => {
    const { strategy, productsRepo, inventoryRepo, storeRepo } =
      createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([]),
      getInventorySummaries: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.getAllProducts).toHaveBeenCalledWith(store);
    expect(service.getInventorySummaries).not.toHaveBeenCalled();
    expect(productsRepo.insertProducts).not.toHaveBeenCalled();
    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
    expect(storeRepo.updateSyncTimestamps).not.toHaveBeenCalled();
  });

  it('upserts changed Amazon inventory rows and advances the product cursor', async () => {
    const { strategy, productsRepo, inventoryRepo, storeRepo } =
      createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([
        {
          'seller-sku': 'AMAZON-SKU-1',
          'item-name': 'Amazon Candle',
          'item-description': 'Scented',
          price: '25.50',
          status: 'Active',
          asin1: 'ASIN1',
          asin2: null,
          asin3: null,
        },
      ]),
      getInventorySummaries: jest.fn().mockResolvedValue([
        {
          sellerSku: 'AMAZON-SKU-1',
          totalQuantity: 9,
          inventoryDetails: {
            inboundWorkingQuantity: 2,
            reservedQuantity: { totalReservedQuantity: 1 },
          },
        },
      ]),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['AMAZON-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({});
    inventoryRepo.updateInventoryBatch.mockResolvedValue(undefined);
    storeRepo.updateSyncTimestamps.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.insertProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'amazon',
        sku: 'AMAZON-SKU-1',
        title: 'Amazon Candle',
      }),
    ]);
    expect(service.getInventorySummaries).toHaveBeenCalledWith(
      store,
      '2026-01-01T00:00:00.000Z',
    );
    expect(inventoryRepo.updateInventoryBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        product_id: 'product-db-1',
        sku: 'AMAZON-SKU-1',
        platform_quantity: 9,
        inbound_quantity: 2,
        reserved_quantity: 1,
      }),
    ]);
    expect(storeRepo.updateSyncTimestamps).toHaveBeenCalledWith(
      store.id,
      'products',
      expect.any(String),
    );
  });

  it('skips inventory upsert for unchanged inventory but still advances cursor', async () => {
    const { strategy, productsRepo, inventoryRepo, storeRepo } =
      createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([
        {
          'seller-sku': 'AMAZON-SKU-1',
          'item-name': 'Amazon Candle',
          'item-description': 'Scented',
          price: '25.50',
          status: 'Active',
          asin1: 'ASIN1',
          asin2: null,
          asin3: null,
        },
      ]),
      getInventorySummaries: jest.fn().mockResolvedValue([
        {
          sellerSku: 'AMAZON-SKU-1',
          totalQuantity: 9,
          inventoryDetails: {
            inboundWorkingQuantity: 2,
            reservedQuantity: { totalReservedQuantity: 1 },
          },
        },
      ]),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['AMAZON-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({
      'AMAZON-SKU-1': {
        platform_quantity: 9,
        warehouse_quantity: 9,
        inbound_quantity: 2,
        reserved_quantity: 1,
        inventory_status: 'in_stock',
      },
    });
    storeRepo.updateSyncTimestamps.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
    expect(storeRepo.updateSyncTimestamps).toHaveBeenCalledWith(
      store.id,
      'products',
      expect.any(String),
    );
  });
});
