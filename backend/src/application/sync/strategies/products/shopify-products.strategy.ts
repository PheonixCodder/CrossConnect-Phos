import { Inject, Injectable, Logger } from '@nestjs/common';
import { ShopifyService } from '../../../../infrastructure/external/connectors/shopify/shopify.service';
import {
  buildShopifySku,
  mapShopifyInventoryToDB,
  mapShopifyProductToDB,
  ShopifyInventoryItemNode,
  ShopifyProductNode,
  shouldUpdateShopifyInventory,
} from '../../../../infrastructure/external/connectors/shopify/shopify.mapper';
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
export class ShopifyProductsStrategy
  implements SyncStrategy<ProductsSyncStrategyContext>
{
  readonly platform = 'shopify' as const;
  readonly domain = 'products' as const;
  private readonly logger = new Logger(ShopifyProductsStrategy.name);

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
    await this.processShopifyProducts(service as ShopifyService, store);
  }

  private async processShopifyProducts(
    service: ShopifyService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      this.logger.log(`Starting product sync for platform: ${store.platform}`);

      const products: ShopifyProductNode[] = await service.fetchProducts();
      if (!products.length) {
        this.logger.warn('No products found on Shopify. Skipping.');
        return;
      }

      const productRows = products.flatMap((p) =>
        mapShopifyProductToDB(p, store.id),
      );

      if (productRows.length > 0) {
        await this.productsRepo.insertProducts(productRows);
      }

      const skus = productRows.map((p) => p.sku);

      const productIdRows =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          store.platform,
        );

      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      const inventoryItems: ShopifyInventoryItemNode[] =
        await service.fetchInventory();

      const inventoryUpserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      for (const item of inventoryItems) {
        const productGid = item.variant?.product?.id;
        if (!productGid) continue;

        const inventoryItemId = item.id.split('/').pop();
        const sku = buildShopifySku(productGid, item.sku, inventoryItemId);
        const productId = productIdRows.get(sku);
        if (!productId) continue;

        for (const level of item.inventoryLevels.nodes) {
          const next = mapShopifyInventoryToDB(
            item,
            level,
            store.id,
            productId,
          );

          const existing = existingInventory[sku];

          if (!existing || shouldUpdateShopifyInventory(existing, next)) {
            inventoryUpserts.push(next);
          }
        }
      }

      const deduped = Array.from(
        new Map(
          inventoryUpserts.map((i) => [`${i.store_id}-${i.sku}`, i]),
        ).values(),
      );

      if (deduped.length > 0) {
        await this.inventoryRepo.updateInventoryBatch(deduped);

        this.logger.log(
          `Successfully synced ${deduped.length} inventory records.`,
        );
      } else {
        this.logger.log('No inventory changes detected.');
      }
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
