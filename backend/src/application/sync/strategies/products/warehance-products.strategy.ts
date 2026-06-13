import { Inject, Injectable, Logger } from '@nestjs/common';
import { ListProductsResponse200 } from '../../../../../.api/apis/warehance-api';
import {
  mapPlatformInventoryToDB,
  mapWarehanceProductsToDB,
  shouldUpdateWarehouseInventory,
} from '../../../../infrastructure/external/connectors/warehance/warehance.mapper';
import { WarehanceService } from '../../../../infrastructure/external/connectors/warehance/warehance.service';
import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
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
export class WarehanceProductsStrategy
  implements SyncStrategy<ProductsSyncStrategyContext>
{
  readonly platform = 'warehance' as const;
  readonly domain = 'products' as const;
  private readonly logger = new Logger(WarehanceProductsStrategy.name);

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
    const warehanceService = service as WarehanceService;
    const syncStart = new Date();

    const since = store.last_products_synced_at
      ? new Date(store.last_products_synced_at).toISOString()
      : undefined;

    try {
      this.logger.log(
        `Starting Warehance products sync for store ${store.id} ` +
          `(incremental: ${since ? 'yes' : 'full'})`,
      );

      const response: ListProductsResponse200['data'] =
        await warehanceService.getProducts();
      const products = response?.products ?? [];

      if (!products.length) {
        this.logger.log('No products found (or no changes since last sync)');
        return;
      }

      this.logger.log(`Fetched ${products.length} products`);

      const productInserts = mapWarehanceProductsToDB(
        response,
        store.id,
        store.platform,
      );

      await this.productsRepo.insertProducts(productInserts);

      const skus = productInserts.map((p) => p.sku).filter(Boolean);
      this.logger.debug(
        `Resolving product IDs for ${skus.length} SKUs in batches`,
      );

      const productIdBySku =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          store.platform,
        );

      this.logger.debug(`Fetching existing inventory for ${skus.length} SKUs`);
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      this.logger.debug('Mapping inventory data to DB format');
      let inventoryInserts: Database['public']['Tables']['inventory']['Insert'][];
      try {
        inventoryInserts = mapPlatformInventoryToDB(
          products,
          store.id,
          productIdBySku,
        );
      } catch (error) {
        this.logger.error('Failed to map inventory data', error);
        throw new Error(`Inventory mapping failed: ${error.message}`);
      }

      if (!inventoryInserts.length) {
        this.logger.log('No inventory changes detected after deduplication');
        return;
      }

      this.logger.debug(`Mapped ${inventoryInserts.length} inventory records`);

      const finalInserts: typeof inventoryInserts = [];

      for (const next of inventoryInserts) {
        const existing = existingInventory[next.sku];
        if (!existing || shouldUpdateWarehouseInventory(existing, next)) {
          finalInserts.push(next);
        }
      }

      if (!finalInserts.length) {
        this.logger.log('No inventory changes after delta check');
        return;
      }

      this.logger.debug(
        `Found ${finalInserts.length} inventory records to update`,
      );

      try {
        await this.inventoryRepo.updateInventoryBatch(finalInserts);
      } catch (error) {
        this.logger.error('Failed to update inventory batch', error);
        throw new Error(`Inventory update failed: ${error.message}`);
      }

      const duration = (Date.now() - syncStart.getTime()) / 1000;

      this.logger.log(
        `Warehance products sync complete: ${productInserts.length} products, ` +
          `${finalInserts.length} inventory updates in ${duration.toFixed(1)}s`,
      );
    } catch (error: any) {
      const duration = (Date.now() - syncStart.getTime()) / 1000;

      this.logger.error(
        `Warehance products sync FAILED for store ${store.id} after ${duration.toFixed(1)}s`,
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
        message: `Warehance products sync failed after ${duration.toFixed(1)}s: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }
}
