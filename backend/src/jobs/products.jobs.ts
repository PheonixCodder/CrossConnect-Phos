import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  mapInventoryToDB,
  mapProductsToDB,
} from 'src/connectors/faire/faire.mapper';
import { FaireService } from 'src/connectors/faire/faire.service';
import { GetInventory } from 'src/connectors/faire/faire.types';
import { InventoryRepository } from 'src/supabase/repositories/inventory.repository';
import { ProductsRepository } from 'src/supabase/repositories/products.repository';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';

@Processor('products', { concurrency: 5 })
export class ProductsProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductsProcessor.name);

  constructor(
    private readonly faireService: FaireService,
    private readonly productsRepo: ProductsRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly storeRepo: StoresRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const platform = job.data.platform as string;

    if (platform === 'FAIRE') {
      /* ------------------------------------------------------------------ */
      /* 1. Resolve Store                                                    */
      /* ------------------------------------------------------------------ */
      const storeId = await this.storeRepo.getStoreId(platform);

      if (!storeId) {
        throw new Error(`Store not found for platform: ${platform}`);
      }

      /* ------------------------------------------------------------------ */
      /* 2. Fetch Products from Faire                                        */
      /* ------------------------------------------------------------------ */
      const { products } = await this.faireService.getProducts();

      if (!products || products.length === 0) {
        this.logger.warn('No products returned from FAIRE');
        return;
      }

      /* ------------------------------------------------------------------ */
      /* 3. Map + Flatten Variants                                           */
      /* ------------------------------------------------------------------ */
      const mappedProducts = products.flatMap((product) =>
        mapProductsToDB(product, storeId),
      );

      if (mappedProducts.length === 0) {
        this.logger.warn('No products mapped after transformation');
        return;
      }

      /* ------------------------------------------------------------------ */
      /* 4. Fetch Inventory from Faire                                       */
      /* ------------------------------------------------------------------ */
      let inventoryData: GetInventory;

      try {
        inventoryData = await this.faireService.getInventory(mappedProducts);
      } catch (err) {
        this.logger.error('Failed to fetch inventory from FAIRE', err);
        return;
      }

      /* ------------------------------------------------------------------ */
      /* 5. Fetch Existing Inventory (for change detection)                  */
      /* ------------------------------------------------------------------ */
      const existingInventory = await this.inventoryRepo.getBySkus(
        mappedProducts.map((p) => p.sku),
        storeId,
      );

      /* ------------------------------------------------------------------ */
      /* 6. Prepare Inventory Updates (change-aware)                         */
      /* ------------------------------------------------------------------ */
      const inventoryBatch = mapInventoryToDB(
        inventoryData,
        storeId,
        mappedProducts,
        existingInventory,
      );

      if (inventoryBatch.length === 0) {
        this.logger.log(
          'Inventory already up to date — no inventory writes required',
        );
      }

      /* ------------------------------------------------------------------ */
      /* 7. Atomic Sync: Products + Inventory                                */
      /* ------------------------------------------------------------------ */
      const { error } = await this.productsRepo.syncProductsAndInventory(
        mappedProducts,
        inventoryBatch,
      );

      if (error) {
        this.logger.error(
          'Atomic FAIRE sync failed (products + inventory)',
          error,
        );
        throw error;
      }

      /* ------------------------------------------------------------------ */
      /* 8. Success Log                                                      */
      /* ------------------------------------------------------------------ */
      this.logger.log(
        `FAIRE sync completed — ${mappedProducts.length} products, ${inventoryBatch.length} inventory updates`,
      );
    }
  }
}
