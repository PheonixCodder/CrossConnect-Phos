import { WarehanceProductsStrategy } from './warehance-products.strategy';

describe('WarehanceProductsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'warehance',
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
      updateStoreHealth: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new WarehanceProductsStrategy(
      productsRepo as any,
      inventoryRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, productsRepo, inventoryRepo, storeRepo, alertsRepo };
  }

  it('skips database work when Warehance returns no products', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getProducts: jest.fn().mockResolvedValue({ products: [] }),
    };

    await strategy.sync({ service, store });

    expect(service.getProducts).toHaveBeenCalled();
    expect(productsRepo.insertProducts).not.toHaveBeenCalled();
    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });

  it('upserts changed Warehance inventory rows', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getProducts: jest.fn().mockResolvedValue({
        products: [
          {
            id: 101,
            sku: 'WARE-SKU-1',
            name: 'Warehance Candle',
            available: 5,
            backordered: 0,
            allocated: 1,
            on_hand: 6,
          },
        ],
      }),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['WARE-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({});
    inventoryRepo.updateInventoryBatch.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.insertProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'warehance',
        sku: 'WARE-SKU-1',
      }),
    ]);
    expect(inventoryRepo.updateInventoryBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        product_id: 'product-db-1',
        sku: 'WARE-SKU-1',
        platform_quantity: 5,
        reserved_quantity: 1,
        warehouse_quantity: 6,
      }),
    ]);
  });

  it('skips inventory update when delta check finds no changes', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getProducts: jest.fn().mockResolvedValue({
        products: [
          {
            id: 101,
            sku: 'WARE-SKU-1',
            name: 'Warehance Candle',
            available: 5,
            backordered: 0,
            allocated: 1,
            on_hand: 6,
          },
        ],
      }),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([['WARE-SKU-1', 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({
      'WARE-SKU-1': {
        platform_quantity: 5,
        inventory_status: 'in_stock',
      },
    });

    await strategy.sync({ service, store });

    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });
});
