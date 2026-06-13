import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Product202309InventorySearchResponseDataInventory,
  Product202502SearchProductsResponseDataProducts,
} from '../../../../libs/tiktok';
import {
  mapTiktokInventoryToDB,
  mapTiktokProductToDB,
  shouldUpdateTiktokInventory,
} from '../../../../infrastructure/external/connectors/tiktok/tiktok.mapper';
import { TikTokService } from '../../../../infrastructure/external/connectors/tiktok/tiktok.service';
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
export class TikTokProductsStrategy implements SyncStrategy<ProductsSyncStrategyContext> {
  readonly platform = 'tiktok' as const;
  readonly domain = 'products' as const;
  private readonly logger = new Logger(TikTokProductsStrategy.name);

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
    const tiktokService = service as TikTokService;

    try {
      this.logger.log(`Starting TikTok product sync for store ${store.id}`);

      const products: Product202502SearchProductsResponseDataProducts[] =
        await tiktokService.getAllProducts(store.id);

      if (!products.length) {
        this.logger.warn('No TikTok products found. Skipping.');
        return;
      }

      const productRows = products.flatMap((p) =>
        mapTiktokProductToDB(p, store.id),
      );

      if (!productRows.length) return;

      await this.productsRepo.insertProducts(productRows);

      const skus = [...new Set(productRows.map((p) => p.sku))];

      const productIdBySku =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'tiktok',
        );

      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      const productIds = [...new Set(products.map((p) => p.id!))];
      const inventoryMap = new Map<
        string,
        Database['public']['Tables']['inventory']['Insert']
      >();

      for (let i = 0; i < productIds.length; i += 50) {
        const batch = productIds.slice(i, i + 50);
        const inventories: Product202309InventorySearchResponseDataInventory[] =
          await tiktokService.getProductInventories(store.id, batch);

        for (const inv of inventories) {
          for (const sku of inv.skus ?? []) {
            if (!sku.sellerSku) continue;

            const productId = productIdBySku.get(sku.sellerSku);
            if (!productId) continue;

            const next = mapTiktokInventoryToDB(inv, sku, store.id, productId);
            const existing = existingInventory[sku.sellerSku];

            if (!existing || shouldUpdateTiktokInventory(existing, next)) {
              inventoryMap.set(sku.sellerSku, next);
            }
          }
        }
      }

      const inventoryUpserts = Array.from(inventoryMap.values());

      if (inventoryUpserts.length) {
        await this.inventoryRepo.updateInventoryBatch(inventoryUpserts);

        this.logger.log(
          `TikTok inventory synced: ${inventoryUpserts.length} rows`,
        );
      } else {
        this.logger.log('No TikTok inventory changes detected.');
      }
    } catch (error) {
      this.logger.error(
        `TikTok product sync failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `TikTok products sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'products_sync_failure',
        message: `TikTok products sync failed: ${error.message}`,
        severity: 'high',
        platform: 'tiktok',
      });

      throw error;
    }
  }
}
