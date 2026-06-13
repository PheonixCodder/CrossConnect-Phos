import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  mapTargetInventoryToSupabaseInventory,
  mapTargetProductToSupabaseProduct,
  TargetProduct,
} from '../../../../infrastructure/external/connectors/target/target.mapper';
import { TargetService } from '../../../../infrastructure/external/connectors/target/target.service';
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
export class TargetProductsStrategy
  implements SyncStrategy<ProductsSyncStrategyContext>
{
  readonly platform = 'target' as const;
  readonly domain = 'products' as const;
  private readonly logger = new Logger(TargetProductsStrategy.name);

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
    const targetService = service as TargetService;

    try {
      const since = store.last_products_synced_at
        ? new Date(store.last_products_synced_at).toISOString()
        : undefined;

      const targetProducts: TargetProduct[] =
        await targetService.getAllProducts(since);

      if (!targetProducts.length) {
        this.logger.warn('No products returned from Target');
        return;
      }

      const productInserts = targetProducts.map((p) =>
        mapTargetProductToSupabaseProduct(p, store.id),
      );

      await this.productsRepo.insertProducts(productInserts);

      const skus = targetProducts.map((p) => p.external_id);

      const productIdRows =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'target',
        );

      const inventoryInserts = targetProducts
        .map((p) => {
          const productId = productIdRows.get(p.external_id);
          if (!productId) return null;

          return mapTargetInventoryToSupabaseInventory(
            p,
            store.id,
            productId,
          );
        })
        .filter(
          (row): row is Database['public']['Tables']['inventory']['Insert'] =>
            Boolean(row),
        );

      if (!inventoryInserts.length) {
        this.logger.warn('No inventory rows generated for Target');
        return;
      }

      await this.inventoryRepo.updateInventoryBatch(inventoryInserts);

      this.logger.log(
        `Target sync complete: ${productInserts.length} products, ${inventoryInserts.length} inventory rows`,
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
