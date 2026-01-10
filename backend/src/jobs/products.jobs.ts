import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  mapInventoryToDB,
  mapProductsToDB,
} from 'src/connectors/faire/faire.mapper';
import { FaireService } from 'src/connectors/faire/faire.service';
import { GetInventory } from 'src/connectors/faire/faire.types';
import {
  mapTargetInventoryToSupabaseInventory,
  mapTargetProductToSupabaseProduct,
} from 'src/connectors/target/target.mapper';
import { TargetService } from 'src/connectors/target/target.service';
import { InventoryRepository } from 'src/supabase/repositories/inventory.repository';
import { ProductsRepository } from 'src/supabase/repositories/products.repository';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { Database } from 'src/supabase/supabase.types';

@Processor('products', { concurrency: 5 })
export class ProductsProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductsProcessor.name);

  constructor(
    private readonly faireService: FaireService,
    private readonly productsRepo: ProductsRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly storeRepo: StoresRepository,
    private readonly targetService: TargetService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const platform = job.data.platform as string;

    if (platform === 'faire') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId)
        throw new Error(`Store not found for platform: ${platform}`);

      // ------------------------------
      // 2️⃣ Fetch Products from Faire
      // ------------------------------
      const { products } = await this.faireService.getProducts();
      if (!products || products.length === 0) {
        this.logger.warn('No products returned from faire');
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
        this.logger.error('Failed to fetch inventory from faire', err);
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
          'Atomic faire sync failed (products + inventory)',
          error,
        );
        throw error;
      }

      // ------------------------------
      // 🔟 Success Log
      // ------------------------------
      this.logger.log(
        `faire sync completed — ${insertedProducts.length} products, ${inventoryBatch.length} inventory updates`,
      );
    }
    if (platform === 'target') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) {
        throw new Error(`Store not found for platform: ${platform}`);
      }

      // ------------------------------
      // 2️⃣ Fetch ALL Target Products
      // ------------------------------
      const targetProducts = await this.targetService.getAllProducts();
      if (!targetProducts.length) {
        this.logger.warn('No products returned from Target');
        return;
      }

      // ------------------------------
      // 3️⃣ Insert / Upsert Products
      // ------------------------------
      const productInserts = targetProducts.map((p) =>
        mapTargetProductToSupabaseProduct(p, storeId),
      );

      await this.productsRepo.insertProducts(productInserts);

      // ------------------------------
      // 4️⃣ Resolve product_id by SKU
      // ------------------------------
      const skus = targetProducts.map((p) => p.external_id);

      const productIdRows = await this.productsRepo.getIdsBySkus(
        storeId,
        skus,
        'target',
      );

      const productIdBySku = new Map(
        productIdRows.map((row) => [row.sku, row.id]),
      );

      // ------------------------------
      // 5️⃣ Build Inventory Rows (FK-safe)
      // ------------------------------
      const inventoryInserts = targetProducts
        .map((p) => {
          const productId = productIdBySku.get(p.external_id);
          if (!productId) return null;

          return mapTargetInventoryToSupabaseInventory(p, storeId, productId);
        })
        .filter(
          (row): row is Database['public']['Tables']['inventory']['Insert'] =>
            Boolean(row),
        );

      if (!inventoryInserts.length) {
        this.logger.warn('No inventory rows generated for Target');
        return;
      }

      // ------------------------------
      // 6️⃣ Upsert Inventory (existing repo method)
      // ------------------------------
      await this.inventoryRepo.updateInventoryBatch(inventoryInserts);

      this.logger.log(
        `Target sync complete: ${productInserts.length} products, ${inventoryInserts.length} inventory rows`,
      );
    }
  }
}
