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

    if (platform !== 'FAIRE') return;

    // ------------------------------
    // 1️⃣ Resolve Store
    // ------------------------------
    const storeId = await this.storeRepo.getStoreId(platform);
    if (!storeId) throw new Error(`Store not found for platform: ${platform}`);

    // ------------------------------
    // 2️⃣ Fetch Products from Faire
    // ------------------------------
    const { products } = await this.faireService.getProducts();
    if (!products || products.length === 0) {
      this.logger.warn('No products returned from FAIRE');
      return;
    }

    // ------------------------------
    // 3️⃣ Map Products → DB schema
    // ------------------------------
    const mappedProducts = products.flatMap((product) =>
      mapProductsToDB(product, storeId),
    );

    if (mappedProducts.length === 0) {
      this.logger.warn('No products mapped after transformation');
      return;
    }

    // ------------------------------
    // 4️⃣ Insert products first to get internal IDs
    // ------------------------------
    const insertedProducts =
      await this.productsRepo.insertProducts(mappedProducts);

    // ------------------------------
    // 5️⃣ Build map: SKU → internal ID
    // ------------------------------
    const productBySku = new Map<string, (typeof insertedProducts)[0]>();
    for (const p of insertedProducts) {
      productBySku.set(p.sku, p);
    }

    // ------------------------------
    // 6️⃣ Fetch Inventory from Faire
    // ------------------------------
    let inventoryData: GetInventory;
    try {
      inventoryData = await this.faireService.getInventory(insertedProducts);
    } catch (err) {
      this.logger.error('Failed to fetch inventory from FAIRE', err);
      return;
    }

    // ------------------------------
    // 7️⃣ Fetch Existing Inventory
    // ------------------------------
    const existingInventory = await this.inventoryRepo.getBySkus(
      insertedProducts.map((p) => p.sku),
      storeId,
    );

    // ------------------------------
    // 8️⃣ Map Inventory → DB schema with internal product IDs
    // ------------------------------
    const inventoryBatch = mapInventoryToDB(
      inventoryData,
      storeId,
      insertedProducts,
      existingInventory,
    );

    // ------------------------------
    // 9️⃣ Atomic sync: Products + Inventory
    // ------------------------------
    const { error } = await this.productsRepo.syncProductsAndInventory(
      insertedProducts,
      inventoryBatch,
    );

    if (error) {
      this.logger.error(
        'Atomic FAIRE sync failed (products + inventory)',
        error,
      );
      throw error;
    }

    // ------------------------------
    // 🔟 Success Log
    // ------------------------------
    this.logger.log(
      `FAIRE sync completed — ${insertedProducts.length} products, ${inventoryBatch.length} inventory updates`,
    );
  }
}
