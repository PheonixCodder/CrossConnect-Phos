import { FaireProductsStrategy } from './faire-products.strategy';

describe('FaireProductsStrategy', () => {
  const store = {
    id: 'store-1',
    platform: 'faire',
  } as any;

  function createStrategy() {
    const productsRepo = {
      insertProducts: jest.fn(),
      syncProductsAndInventory: jest.fn(),
    };
    const inventoryRepo = {
      getBySkus: jest.fn(),
    };
    const storeRepo = {
      updateStoreHealth: jest.fn(),
    };
    const alertsRepo = {
      createAlert: jest.fn(),
    };

    const strategy = new FaireProductsStrategy(
      productsRepo as any,
      inventoryRepo as any,
      storeRepo as any,
      alertsRepo as any,
    );

    return { strategy, productsRepo, inventoryRepo, storeRepo, alertsRepo };
  }

  it('skips database work when Faire returns no products', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([]),
      getInventory: jest.fn(),
    };

    await strategy.sync({ service, store });

    expect(service.getAllProducts).toHaveBeenCalled();
    expect(service.getInventory).not.toHaveBeenCalled();
    expect(productsRepo.insertProducts).not.toHaveBeenCalled();
    expect(inventoryRepo.getBySkus).not.toHaveBeenCalled();
  });

  it('syncs mapped products and inventory atomically', async () => {
    const { strategy, productsRepo, inventoryRepo } = createStrategy();
    const service = {
      getAllProducts: jest.fn().mockResolvedValue([
        {
          name: 'Candle',
          description: 'Scented',
          lifecycle_state: 'PUBLISHED',
          sale_state: 'FOR_SALE',
          variants: [
            {
              id: 'variant-1',
              sku: 'SKU-1',
              name: 'Small',
              wholesale_price_cents: 1299,
            },
          ],
        },
      ]),
      getInventory: jest.fn().mockResolvedValue({
        'SKU-1': {
          on_hand_quantity: { type: 'QUANTITY', quantity: 10 },
          committed_quantity: { type: 'QUANTITY', quantity: 2 },
          available_quantity: { type: 'QUANTITY', quantity: 8 },
        },
      }),
    };
    const insertedProducts = [
      {
        id: 'product-db-1',
        store_id: store.id,
        platform: 'faire',
        sku: 'SKU-1',
      },
    ];

    productsRepo.insertProducts.mockResolvedValue(insertedProducts);
    productsRepo.syncProductsAndInventory.mockResolvedValue({ error: null });
    inventoryRepo.getBySkus.mockResolvedValue({});

    await strategy.sync({ service, store });

    expect(productsRepo.insertProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: store.id,
        platform: 'faire',
        sku: 'SKU-1',
      }),
    ]);
    expect(service.getInventory).toHaveBeenCalledWith(insertedProducts);
    expect(productsRepo.syncProductsAndInventory).toHaveBeenCalledWith(
      insertedProducts,
      [
        expect.objectContaining({
          store_id: store.id,
          product_id: 'product-db-1',
          sku: 'SKU-1',
          platform_quantity: 8,
        }),
      ],
    );
  });
});
