import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  fetchInventoryAdaptive,
  mapWalmartInventoryToDB,
  mapWalmartProductToDB,
  shouldUpdateInventory,
} from '../../../../infrastructure/external/connectors/walmart/walmart.mapper';
import {
  GetInventoryResponse,
  WalmartItem,
} from '../../../../infrastructure/external/connectors/walmart/walmart.types';
import { WalmartService } from '../../../../infrastructure/external/connectors/walmart/walmart.service';
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
export class WalmartProductsStrategy
  implements SyncStrategy<ProductsSyncStrategyContext>
{
  readonly platform = 'walmart' as const;
  readonly domain = 'products' as const;
  private readonly logger = new Logger(WalmartProductsStrategy.name);

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
    const walmartService = service as WalmartService;

    try {
      const walmartProducts: WalmartItem[] = await walmartService.getProducts();
      if (!walmartProducts?.length) {
        this.logger.warn('No products returned from Walmart');
        return;
      }

      const productInserts = mapWalmartProductToDB(walmartProducts, store.id);
      await this.productsRepo.insertProducts(productInserts);

      const skus = productInserts.map((p) => p.sku);
      const productIdRows =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'walmart',
        );

      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      const inventoryInserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      await fetchInventoryAdaptive(productInserts, {
        batchSize: 3,
        initialDelayMs: 500,
        maxRetries: 3,
        handler: async (product) => {
          const productId = productIdRows.get(product.sku);
          if (!productId) return;

          const inventory: GetInventoryResponse | null =
            await walmartService.getInventory(product);
          if (!inventory) return;

          const existing = existingInventory[product.sku];
          if (!existing || shouldUpdateInventory(existing, inventory)) {
            inventoryInserts.push(
              mapWalmartInventoryToDB(inventory, store.id, productId),
            );
          }
        },
      });

      if (!inventoryInserts.length) {
        this.logger.log('No inventory changes detected for Walmart');
        return;
      }

      await this.inventoryRepo.updateInventoryBatch(inventoryInserts);

      this.logger.log(
        `Walmart sync complete: ${productInserts.length} products, ${inventoryInserts.length} inventory updates`,
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
