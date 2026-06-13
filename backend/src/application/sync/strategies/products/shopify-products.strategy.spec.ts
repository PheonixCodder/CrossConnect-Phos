import { ShopifyProductsStrategy } from './shopify-products.strategy';

describe('ShopifyProductsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'shopify',
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

    const strategy = new ShopifyProductsStrategy(
      productsRepo as any,
      inventoryRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, productsRepo, inventoryRepo, storeRepo, alertsRepo };
  }

  it('skips inventory work when Shopify returns no products', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      fetchProducts: jest.fn().mockResolvedValue([]),
      fetchInventory: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.fetchProducts).toHaveBeenCalled();
    expect(service.fetchInventory).not.toHaveBeenCalled();
    expect(productsRepo.insertProducts).not.toHaveBeenCalled();
    expect(inventoryRepo.updateInventoryBatch).not.toHaveBeenCalled();
  });

  it('upserts deduplicated inventory rows for mapped Shopify products', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const productGid = 'gid://shopify/Product/123';
    const variantGid = 'gid://shopify/ProductVariant/456';
    const inventoryGid = 'gid://shopify/InventoryItem/789';
    const sku = 'shopify-123-SKU-1';
    const service = {
      fetchProducts: jest.fn().mockResolvedValue([
        {
          id: productGid,
          title: 'Test product',
          descriptionPlainSummary: 'Description',
          status: 'ACTIVE',
          variants: {
            nodes: [
              {
                id: variantGid,
                sku: 'SKU-1',
                price: '10.00',
              },
            ],
          },
        },
      ]),
      fetchInventory: jest.fn().mockResolvedValue([
        {
          id: inventoryGid,
          sku: 'SKU-1',
          variant: { product: { id: productGid } },
          inventoryLevels: {
            nodes: [
              { quantities: [{ name: 'available', quantity: 4 }] },
              { quantities: [{ name: 'available', quantity: 7 }] },
            ],
          },
        },
      ]),
    };

    productsRepo.insertProducts.mockResolvedValue(undefined);
    productsRepo.getProductIdsBySkusInBatches.mockResolvedValue(
      new Map([[sku, 'product-db-1']]),
    );
    inventoryRepo.getBySkus.mockResolvedValue({});
    inventoryRepo.updateInventoryBatch.mockResolvedValue(undefined);

    await strategy.sync({ service, store });

    expect(productsRepo.insertProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'shopify',
        sku,
      }),
    ]);
    expect(inventoryRepo.updateInventoryBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        product_id: 'product-db-1',
        sku,
      }),
    ]);
  });
});
