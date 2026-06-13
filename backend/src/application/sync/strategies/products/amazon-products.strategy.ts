import { Inject, Injectable, Logger } from '@nestjs/common';
import { InventorySummary } from '@sp-api-sdk/fba-inventory-api-v1';
import {
  mapAmazonInventoryFromFbaSummary,
  mapAmazonProductToSupabaseProduct,
  shouldUpdateAmazonInventory,
} from '../../../../infrastructure/external/connectors/amazon/amazon.mapper';
import { AmazonMerchantListingRow } from '../../../../infrastructure/external/connectors/amazon/amazon.types';
import { AmazonService } from '../../../../infrastructure/external/connectors/amazon/amazon.service';
import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
import { SyncStrategy } from '../../sync-strategy.types';
import { ProductsSyncStrategyContext } from './products-sync-strategy.types';
import {
  INVENTORY_REPOSITORY,
  InventoryRepositoryPort,
  PRODUCTS_REPOSITORY,
  ProductsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';

@Injectable()
export class AmazonProductsStrategy
  implements SyncStrategy<ProductsSyncStrategyContext>
{
  readonly platform = 'amazon' as const;
  readonly domain = 'products' as const;
  private readonly logger = new Logger(AmazonProductsStrategy.name);

  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepo: ProductsRepositoryPort,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: InventoryRepositoryPort,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
  ) {}

  async sync({ service, store }: ProductsSyncStrategyContext): Promise<void> {
    const amazonService = service as AmazonService;

    try {
      const listings: AmazonMerchantListingRow[] =
        await amazonService.getAllProducts(store);

      if (!listings.length) {
        this.logger.warn('No Amazon listings returned');
        return;
      }

      const productInserts = listings.map((row) =>
        mapAmazonProductToSupabaseProduct(row, store.id),
      );

      await this.productsRepo.insertProducts(productInserts);

      const skus = productInserts.map((p) => p.sku);

      const productIdRows =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'amazon',
        );

      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      const inventorySummaries: InventorySummary[] =
        await amazonService.getInventorySummaries(
          store,
          store.last_products_synced_at
            ? new Date(store.last_products_synced_at).toISOString()
            : undefined,
        );

      const inventoryInserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      for (const summary of inventorySummaries) {
        const sku = summary.sellerSku;
        if (!sku) continue;

        const productId = productIdRows.get(sku);
        if (!productId) continue;

        const mapped = mapAmazonInventoryFromFbaSummary(
          summary,
          store.id,
          productId,
        );

        const existing = existingInventory[sku];

        if (!existing || shouldUpdateAmazonInventory(existing, mapped)) {
          inventoryInserts.push(mapped);
        }
      }

      if (inventoryInserts.length) {
        await this.inventoryRepo.updateInventoryBatch(inventoryInserts);
      }

      await this.storeRepo.updateSyncTimestamps(
        store.id,
        'products',
        new Date().toISOString(),
      );

      this.logger.log(
        `Amazon products synced: ${productInserts.length} products, ${inventoryInserts.length} inventory updates`,
      );
    } catch (error) {
      this.logger.error(
        `AMAZON products failed for store ${store.id}`,
        error.stack,
      );
      throw error;
    }
  }
}
