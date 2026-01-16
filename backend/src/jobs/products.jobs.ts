import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  mapAmazonInventoryFromFbaSummary,
  mapAmazonProductToSupabaseProduct,
  shouldUpdateAmazonInventory,
} from 'src/connectors/amazon/amazon.mapper';
import { AmazonService } from 'src/connectors/amazon/amazon.service';
import {
  mapInventoryToDB,
  mapProductsToDB,
} from 'src/connectors/faire/faire.mapper';
import { FaireService } from 'src/connectors/faire/faire.service';
import { GetInventory } from 'src/connectors/faire/faire.types';
import {
  mapShopifyInventoryToDB,
  mapShopifyProductToDB,
  shouldUpdateShopifyInventory,
} from 'src/connectors/shopify/shopify.mapper';
import { ShopifyService } from 'src/connectors/shopify/shopify.service';
import {
  mapTargetInventoryToSupabaseInventory,
  mapTargetProductToSupabaseProduct,
} from 'src/connectors/target/target.mapper';
import { TargetService } from 'src/connectors/target/target.service';
import {
  fetchInventoryAdaptive,
  mapWalmartInventoryToDB,
  mapWalmartProductToDB,
  shouldUpdateInventory,
} from 'src/connectors/walmart/walmart.mapper';
import { WalmartService } from 'src/connectors/walmart/walmart.service';
import {
  mapPlatformInventoryToDB,
  mapWarehanceProductsToDB,
  shouldUpdateWarehouseInventory,
} from 'src/connectors/warehouse/warehance.mapper';
import { WarehanceService } from 'src/connectors/warehouse/warehance.service';
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
    private readonly walmartService: WalmartService,
    private readonly amazonService: AmazonService,
    private readonly warehanceService: WarehanceService,
    private readonly shopifyService: ShopifyService,
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
    if (platform === 'walmart') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId)
        throw new Error(`Store not found for platform: ${platform}`);

      // ------------------------------
      // 2️⃣ Fetch Products
      // ------------------------------
      const walmartProducts = await this.walmartService.getProducts();
      if (!walmartProducts?.length) {
        this.logger.warn('No products returned from Walmart');
        return;
      }

      // ------------------------------
      // 3️⃣ Upsert Products
      // ------------------------------
      const productInserts = mapWalmartProductToDB(walmartProducts, storeId);
      await this.productsRepo.insertProducts(productInserts);

      // ------------------------------
      // 4️⃣ Resolve product_id by SKU
      // ------------------------------
      const skus = productInserts.map((p) => p.sku);
      const productIdRows = await this.productsRepo.getIdsBySkus(
        storeId,
        skus,
        'walmart',
      );
      const productIdBySku = new Map(
        productIdRows.map((row) => [row.sku, row.id]),
      );

      // ------------------------------
      // 5️⃣ Fetch existing inventory for delta comparison
      // ------------------------------
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        storeId,
      );

      // ------------------------------
      // 6️⃣ Adaptive Inventory Fetch & Delta Mapping
      // ------------------------------
      const inventoryInserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      await fetchInventoryAdaptive(productInserts, {
        batchSize: 3,
        initialDelayMs: 500,
        maxRetries: 3,
        handler: async (product) => {
          const productId = productIdBySku.get(product.sku);
          if (!productId) return;

          const inventory = await this.walmartService.getInventory(product);
          if (!inventory) return;

          const existing = existingInventory[product.sku];
          if (!existing || shouldUpdateInventory(existing, inventory)) {
            inventoryInserts.push(
              mapWalmartInventoryToDB(inventory, storeId, productId),
            );
          }
        },
      });

      if (!inventoryInserts.length) {
        this.logger.log('No inventory changes detected for Walmart');
        return;
      }

      // ------------------------------
      // 7️⃣ Upsert inventory changes
      // ------------------------------
      await this.inventoryRepo.updateInventoryBatch(inventoryInserts);

      this.logger.log(
        `Walmart sync complete: ${productInserts.length} products, ${inventoryInserts.length} inventory updates`,
      );
    }

    if (platform === 'amazon') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const store = await this.storeRepo.getStore('amazon');
      const storeId = store.id;

      // ------------------------------
      // 2️⃣ Fetch Products (Listings Report)
      // ------------------------------
      const listings = await this.amazonService.getAllProducts(store);

      if (!listings.length) {
        this.logger.warn('No Amazon listings returned');
        return;
      }

      // ------------------------------
      // 3️⃣ Upsert Products
      // ------------------------------
      const productInserts: Database['public']['Tables']['products']['Insert'][] =
        listings.map((row) => mapAmazonProductToSupabaseProduct(row, storeId));

      await this.productsRepo.insertProducts(productInserts);

      // ------------------------------
      // 4️⃣ Resolve product_id by SKU
      // ------------------------------
      const skus = productInserts.map((p) => p.sku);

      const productIdRows = await this.productsRepo.getIdsBySkus(
        storeId,
        skus,
        'amazon',
      );

      const productIdBySku = new Map(
        productIdRows.map((row) => [row.sku, row.id]),
      );

      // ------------------------------
      // 5️⃣ Fetch existing inventory for delta comparison
      // ------------------------------
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        storeId,
      );

      // ------------------------------
      // 6️⃣ Fetch FBA Inventory & Delta Mapping
      // ------------------------------
      const inventorySummaries =
        await this.amazonService.getInventorySummaries(store);

      if (!inventorySummaries.length) {
        this.logger.warn('No Amazon inventory summaries returned');
        return;
      }

      const inventoryInserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      for (const summary of inventorySummaries) {
        const sku = summary.sellerSku;
        if (!sku) continue;

        const productId = productIdBySku.get(sku);
        if (!productId) continue;

        const mappedInventory = mapAmazonInventoryFromFbaSummary(
          summary,
          storeId,
          productId,
        );

        const existing = existingInventory[sku];

        if (
          !existing ||
          shouldUpdateAmazonInventory(existing, mappedInventory)
        ) {
          inventoryInserts.push(mappedInventory);
        }
      }

      if (!inventoryInserts.length) {
        this.logger.log('No inventory changes detected for Amazon');
        return;
      }

      // ------------------------------
      // 7️⃣ Upsert inventory changes
      // ------------------------------
      await this.inventoryRepo.updateInventoryBatch(inventoryInserts);

      this.logger.log(
        `Amazon sync complete: ${productInserts.length} products, ${inventoryInserts.length} inventory updates`,
      );
    }
    if (platform === 'warehouse') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId)
        throw new Error(`Store not found for platform: ${platform}`);

      // ------------------------------
      // 2️⃣ Fetch Products
      // ------------------------------
      const response = await this.warehanceService.getProducts();
      const products = response?.products ?? [];

      if (!products.length) {
        this.logger.warn('No products returned from platform');
        return;
      }

      // ------------------------------
      // 3️⃣ Upsert Products
      // ------------------------------
      const productInserts = mapWarehanceProductsToDB(
        response,
        storeId,
        platform,
      );

      await this.productsRepo.insertProducts(productInserts);

      // ------------------------------
      // 4️⃣ Resolve product_id by SKU
      // ------------------------------
      const skus = productInserts.map((p) => p.sku);

      const productIdRows = await this.productsRepo.getIdsBySkus(
        storeId,
        skus,
        platform,
      );

      const productIdBySku = new Map(
        productIdRows.map((row) => [row.sku, row.id]),
      );

      // ------------------------------
      // 5️⃣ Fetch existing inventory
      // ------------------------------
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        storeId,
      );

      // ------------------------------
      // 6️⃣ Inventory Delta Mapping
      // ------------------------------
      const inventoryInserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      for (const product of products) {
        const productId = productIdBySku.get(product.sku!);
        if (!productId) continue;

        const existing = existingInventory[product.sku!];

        const nextInventory = mapPlatformInventoryToDB(
          product,
          storeId,
          productId,
        );

        if (
          !existing ||
          shouldUpdateWarehouseInventory(existing, nextInventory)
        ) {
          inventoryInserts.push(nextInventory);
        }
      }

      if (!inventoryInserts.length) {
        this.logger.log('No inventory changes detected');
        return;
      }

      // ------------------------------
      // 7️⃣ Upsert Inventory
      // ------------------------------
      await this.inventoryRepo.updateInventoryBatch(inventoryInserts);

      this.logger.log(
        `Sync complete: ${productInserts.length} products, ${inventoryInserts.length} inventory updates`,
      );
    }
    if (platform === 'shopify') {
      this.logger.log(`Starting product sync for platform: ${platform}`);

      // 1. Resolve Store
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) throw new Error(`Store ID not found for ${platform}`);

      // 2. Fetch Data with Error Boundary
      const products = await this.shopifyService.fetchProducts();
      if (!products.length) {
        this.logger.warn('No products found on Shopify. Skipping.');
        return;
      }

      // 3. Map & Insert Products
      const productRows = products.flatMap((p) =>
        mapShopifyProductToDB(p, storeId),
      );
      if (productRows.length > 0) {
        await this.productsRepo.insertProducts(productRows);
      }

      // 4. Inventory Sync Logic
      const skus = productRows.map((p) => p.sku).filter(Boolean);
      const productIdRows = await this.productsRepo.getIdsBySkus(
        storeId,
        skus,
        platform,
      );
      const productIdBySku = new Map(productIdRows.map((r) => [r.sku, r.id]));

      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        storeId,
      );
      const inventoryItems = await this.shopifyService.fetchInventory();

      const inventoryUpserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      for (const item of inventoryItems) {
        if (!item.sku) continue;
        const productId = productIdBySku.get(item.sku);
        if (!productId) continue;

        for (const level of item.inventoryLevels.nodes) {
          const next = mapShopifyInventoryToDB(item, level, storeId, productId);
          const existing = existingInventory[item.sku];

          if (!existing || shouldUpdateShopifyInventory(existing, next)) {
            inventoryUpserts.push(next);
          }
        }
      }

      // 5. Batch Update
      if (inventoryUpserts.length > 0) {
        await this.inventoryRepo.updateInventoryBatch(inventoryUpserts);
        this.logger.log(
          `Successfully synced ${inventoryUpserts.length} inventory records.`,
        );
      } else {
        this.logger.log('No inventory changes detected.');
      }
    }
  }
}
