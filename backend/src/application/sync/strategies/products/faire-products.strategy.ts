import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  mapInventoryToDB,
  mapProductsToDB,
} from '../../../../infrastructure/external/connectors/faire/faire.mapper';
import { GetInventory } from '../../../../infrastructure/external/connectors/faire/faire.types';
import { FaireService } from '../../../../infrastructure/external/connectors/faire/faire.service';
import { SyncStrategy } from '../../sync-strategy.types';
import { ProductsSyncStrategyContext } from './products-sync-strategy.types';
import {
  ALERTS_REPOSITORY,
  AlertsRepositoryPort,
  INVENTORY_REPOSITORY,
  InventoryRepositoryPort,
  PRODUCTS_REPOSITORY,
  ProductsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';

@Injectable()
export class FaireProductsStrategy
  implements SyncStrategy<ProductsSyncStrategyContext>
{
  readonly platform = 'faire' as const;
  readonly domain = 'products' as const;
  private readonly logger = new Logger(FaireProductsStrategy.name);

  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepo: ProductsRepositoryPort,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: InventoryRepositoryPort,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(ALERTS_REPOSITORY)
    private readonly alertsRepo: AlertsRepositoryPort,
  ) {}

  async sync({ service, store }: ProductsSyncStrategyContext): Promise<void> {
    try {
      const faireService = service as FaireService;
      const products = await faireService.getAllProducts();

      if (!products || products.length === 0) {
        this.logger.warn('No products returned from faire');
        return;
      }

      const mappedProducts = products.flatMap((product) =>
        mapProductsToDB(product, store.id),
      );

      if (mappedProducts.length === 0) {
        this.logger.warn('No products mapped after transformation');
        return;
      }

      const insertedProducts =
        await this.productsRepo.insertProducts(mappedProducts);

      let inventoryData: GetInventory;
      try {
        inventoryData = await faireService.getInventory(insertedProducts);
      } catch (err) {
        this.logger.error('Failed to fetch inventory from faire', err);
        return;
      }

      const existingInventory = await this.inventoryRepo.getBySkus(
        insertedProducts.map((p) => p.sku),
        store.id,
      );

      const inventoryBatch = mapInventoryToDB(
        inventoryData,
        store.id,
        insertedProducts,
        existingInventory,
      );

      const { error } = await this.productsRepo.syncProductsAndInventory(
        insertedProducts,
        inventoryBatch,
      );

      if (error) {
        this.logger.error(
          'Atomic faire sync failed (products + inventory)',
          error,
        );
        throw error;
      }

      this.logger.log(
        `faire sync completed - ${insertedProducts.length} products, ${inventoryBatch.length} inventory updates`,
      );
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} products failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Products sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'products_sync_failure',
        message: `${store.platform.toUpperCase()} products sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }
}
