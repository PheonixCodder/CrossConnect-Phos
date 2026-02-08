import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformServiceFactory } from '../connectors/platform-factory.service';
import { InventoryRepository } from '../supabase/repositories/inventory.repository';
import { ProductsRepository } from '../supabase/repositories/products.repository';
import { StoresRepository } from '../supabase/repositories/stores.repository';
import { Database } from '../supabase/supabase.types';

// Import all mappers
import {
  FaireProduct,
  mapInventoryToDB,
  mapProductsToDB,
} from '../connectors/faire/faire.mapper';
import { GetInventory } from '../connectors/faire/faire.types';
import {
  mapShopifyInventoryToDB,
  mapShopifyProductToDB,
  ShopifyInventoryItemNode,
  ShopifyProductNode,
  shouldUpdateShopifyInventory,
} from '../connectors/shopify/shopify.mapper';
import {
  mapTargetInventoryToSupabaseInventory,
  mapTargetProductToSupabaseProduct,
  TargetProduct,
} from '../connectors/target/target.mapper';
import {
  fetchInventoryAdaptive,
  mapWalmartInventoryToDB,
  mapWalmartProductToDB,
  shouldUpdateInventory,
} from '../connectors/walmart/walmart.mapper';
import {
  mapPlatformInventoryToDB,
  mapWarehanceProductsToDB,
  shouldUpdateWarehouseInventory,
} from '../connectors/warehouse/warehance.mapper';
import {
  mapAmazonInventoryFromFbaSummary,
  mapAmazonProductToSupabaseProduct,
  shouldUpdateAmazonInventory,
} from '../connectors/amazon/amazon.mapper';
import { StoreCredentialsService } from '../supabase/repositories/store_credentials.repository';
import {
  GetInventoryResponse,
  WalmartItem,
} from '../connectors/walmart/walmart.types';
import { AmazonMerchantListingRow } from '../connectors/amazon/amazon.types';
import { InventorySummary } from '@sp-api-sdk/fba-inventory-api-v1';
import { ListProductsResponse200 } from '../../.api/apis/warehance-api';
import { AlertsRepository } from '../supabase/repositories/alerts.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Product202309InventorySearchResponseDataInventory,
  Product202502SearchProductsResponseDataProducts,
} from '../libs/tiktok';
import {
  mapTiktokInventoryToDB,
  mapTiktokProductToDB,
  shouldUpdateTiktokInventory,
} from '../connectors/tiktok/tiktok.mapper';
import { ShopifyService } from '../connectors/shopify/shopify.service';
import { WarehanceService } from '../connectors/warehouse/warehance.service';
import { AmazonService } from '../connectors/amazon/amazon.service';
import { WalmartService } from '../connectors/walmart/walmart.service';
import { TargetService } from '../connectors/target/target.service';
import { FaireService } from '../connectors/faire/faire.service';
import { TikTokService } from '../connectors/tiktok/tiktok.service';

@Processor('products', { concurrency: 5 })
export class ProductsProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductsProcessor.name);

  constructor(
    private readonly platformFactory: PlatformServiceFactory,
    private readonly productsRepo: ProductsRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly storeRepo: StoresRepository,
    private readonly storeCredentialsService: StoreCredentialsService,
    private readonly alertsRepo: AlertsRepository,
    private readonly supabaseClient: SupabaseClient,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const {
      storeId,
      platform,
    }: {
      storeId: string;
      platform: Database['public']['Enums']['platform_types'];
      orgId: string;
    } = job.data;

    if (!storeId) {
      throw new Error('storeId is required');
    }

    try {
      // Get store and credentials
      const store = await this.storeRepo.getStoreById(storeId);
      const credentials =
        await this.storeCredentialsService.getCredentialsByStoreId(storeId);

      // Create platform-specific service with credentials
      let service;
      try {
        service = await this.platformFactory.createService(
          platform,
          credentials,
          store,
        );
      } catch (serviceError) {
        this.logger.error(
          `Failed to create service for ${platform}`,
          serviceError,
        );
        await this.storeRepo.updateStoreHealth(
          storeId,
          'unhealthy',
          `Failed to initialize platform service: ${serviceError.message}`,
        );
        throw serviceError;
      }

      // Process based on platform
      switch (platform) {
        case 'faire':
          await this.processFaireProducts(service as FaireService, store);
          break;
        case 'target':
          await this.processTargetProducts(service as TargetService, store);
          break;
        case 'walmart':
          await this.processWalmartProducts(service as WalmartService, store);
          break;
        case 'amazon':
          await this.processAmazonProducts(service as AmazonService, store);
          break;
        case 'warehance':
          await this.processWarehanceProducts(
            service as WarehanceService,
            store,
          );
          break;
        case 'shopify':
          await this.processShopifyProducts(service as ShopifyService, store);
          break;
        case 'tiktok':
          await this.processTiktokProducts(service as TikTokService, store);
          break;
      }

      // Update store health on success
      await this.storeRepo.updateStoreHealth(storeId, 'healthy');

      await this.supabaseClient
        .from('stores')
        .update({
          last_synced_at: new Date().toISOString(),
          last_products_synced_at: new Date().toISOString(),
        })
        .eq('id', store.id);
    } catch (error) {
      this.logger.error(
        `Failed to process products for store ${storeId}: ${error.message}`,
        error.stack,
      );

      // Update store health on failure
      if (storeId) {
        await this.storeRepo.updateStoreHealth(
          storeId,
          'unhealthy',
          `Products sync failed: ${error.message}`,
        );
      }

      throw error;
    }
  }

  private async processFaireProducts(
    service: FaireService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch Products from Faire
      const products = await service.getAllProducts();
      if (!products || products.length === 0) {
        this.logger.warn('No products returned from faire');
        return;
      }

      // 2️⃣ Map Products → DB schema
      const mappedProducts = products.flatMap((product) =>
        mapProductsToDB(product, store.id),
      );

      if (mappedProducts.length === 0) {
        this.logger.warn('No products mapped after transformation');
        return;
      }

      // 3️⃣ Insert products first to get internal IDs
      const insertedProducts =
        await this.productsRepo.insertProducts(mappedProducts);

      // 4️⃣ Build map: SKU → internal ID
      const productBySku = new Map<string, (typeof insertedProducts)[0]>();
      for (const p of insertedProducts) {
        productBySku.set(p.sku, p);
      }

      // 5️⃣ Fetch Inventory from Faire
      let inventoryData: GetInventory;
      try {
        inventoryData = await service.getInventory(insertedProducts);
      } catch (err) {
        this.logger.error('Failed to fetch inventory from faire', err);
        return;
      }

      // 6️⃣ Fetch Existing Inventory
      const existingInventory = await this.inventoryRepo.getBySkus(
        insertedProducts.map((p) => p.sku),
        store.id,
      );

      // 7️⃣ Map Inventory → DB schema with internal product IDs
      const inventoryBatch = mapInventoryToDB(
        inventoryData,
        store.id,
        insertedProducts,
        existingInventory,
      );

      // 8️⃣ Atomic sync: Products + Inventory
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

      this.logger.log(
        `faire sync completed — ${insertedProducts.length} products, ${inventoryBatch.length} inventory updates`,
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

  private async processTargetProducts(
    service: TargetService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_products_synced_at
        ? new Date(store.last_products_synced_at).toISOString()
        : undefined;

      // 1️⃣ Fetch ALL Target Products
      const targetProducts: TargetProduct[] =
        await service.getAllProducts(since);
      if (!targetProducts.length) {
        this.logger.warn('No products returned from Target');
        return;
      }

      // 2️⃣ Insert / Upsert Products
      const productInserts = targetProducts.map((p) =>
        mapTargetProductToSupabaseProduct(p, store.id),
      );

      await this.productsRepo.insertProducts(productInserts);

      // 3️⃣ Resolve product_id by SKU
      const skus = targetProducts.map((p) => p.external_id);

      const productIdRows =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'target',
        );

      // 4️⃣ Build Inventory Rows (FK-safe)
      const inventoryInserts = targetProducts
        .map((p) => {
          const productId = productIdRows.get(p.external_id);
          if (!productId) return null;

          return mapTargetInventoryToSupabaseInventory(p, store.id, productId);
        })
        .filter(
          (row): row is Database['public']['Tables']['inventory']['Insert'] =>
            Boolean(row),
        );

      if (!inventoryInserts.length) {
        this.logger.warn('No inventory rows generated for Target');
        return;
      }

      // 5️⃣ Upsert Inventory (existing repo method)
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

  private async processWalmartProducts(
    service: WalmartService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch Products
      const walmartProducts: WalmartItem[] = await service.getProducts();
      if (!walmartProducts?.length) {
        this.logger.warn('No products returned from Walmart');
        return;
      }

      // 2️⃣ Upsert Products
      const productInserts = mapWalmartProductToDB(walmartProducts, store.id);
      await this.productsRepo.insertProducts(productInserts);

      // 3️⃣ Resolve product_id by SKU
      const skus = productInserts.map((p) => p.sku);
      const productIdRows =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'walmart',
        );

      // 4️⃣ Fetch existing inventory for delta comparison
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      // 5️⃣ Adaptive Inventory Fetch & Delta Mapping
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
            await service.getInventory(product);
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

      // 6️⃣ Upsert inventory changes
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

  private async processAmazonProducts(
    service: AmazonService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // ❗ Products are SNAPSHOT – no since filtering
      const listings = await service.getAllProducts(store);

      if (!listings.length) {
        this.logger.warn('No Amazon listings returned');
        return;
      }

      // 1️⃣ Upsert products
      const productInserts = listings.map((row) =>
        mapAmazonProductToSupabaseProduct(row, store.id),
      );

      await this.productsRepo.insertProducts(productInserts);

      // 2️⃣ Resolve product IDs
      const skus = productInserts.map((p) => p.sku);

      const productIdRows =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'amazon',
        );

      // 3️⃣ Existing inventory
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      // 4️⃣ Inventory delta (uses last sync correctly)
      const inventorySummaries = await service.getInventorySummaries(
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

      // ✅ CURSOR UPDATE (CRITICAL)
      await this.storeRepo.update(store.id, 'products', {
        last_synced_at: new Date().toISOString(),
      });

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

  private async processWarehanceProducts(
    service: WarehanceService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    const syncStart = new Date();

    const since = store.last_products_synced_at
      ? new Date(store.last_products_synced_at).toISOString()
      : undefined;

    try {
      this.logger.log(
        `Starting Warehance products sync for store ${store.id} ` +
          `(incremental: ${since ? 'yes' : 'full'})`,
      );

      // ── 1. Fetch ALL Products (incremental if supported)
      const response: ListProductsResponse200['data'] =
        await service.getProducts();
      const products = response?.products ?? [];

      if (!products.length) {
        this.logger.log('No products found (or no changes since last sync)');
        return;
      }

      this.logger.log(`Fetched ${products.length} products`);

      // ── 2. Upsert Products (batched + parallel)
      const productInserts = mapWarehanceProductsToDB(
        response,
        store.id,
        store.platform,
      );

      await this.productsRepo.insertProducts(productInserts);

      // ── 3. Resolve product_id by SKU (batched to avoid URL limits)
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

      // ── 4. Fetch existing inventory (for delta check) - also batched
      this.logger.debug(`Fetching existing inventory for ${skus.length} SKUs`);
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      // ── 5. Inventory Delta Mapping + Deduplication
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

      // Optional final delta check (recommended)
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

      // ── 6. Bulk Upsert Inventory (batched + parallel)
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

  private async processShopifyProducts(
    service: ShopifyService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_products_synced_at
        ? new Date(store.last_products_synced_at).toISOString()
        : undefined;

      this.logger.log(`Starting product sync for platform: ${store.platform}`);

      // 1. Fetch Data with Error Boundary
      const products: ShopifyProductNode[] = await service.fetchProducts();
      if (!products.length) {
        this.logger.warn('No products found on Shopify. Skipping.');
        return;
      }

      // 2. Map & Insert Products
      const productRows = products.flatMap((p) =>
        mapShopifyProductToDB(p, store.id),
      );
      if (productRows.length > 0) {
        await this.productsRepo.insertProducts(productRows);
      }

      // 3. Inventory Sync Logic
      const skus = productRows.map((p) => p.sku).filter(Boolean);
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
        await service.fetchInventory(since);

      const inventoryUpserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      for (const item of inventoryItems) {
        if (!item.sku) continue;
        const productId = productIdRows.get(item.sku);
        if (!productId) continue;

        for (const level of item.inventoryLevels.nodes) {
          const next = mapShopifyInventoryToDB(
            item,
            level,
            store.id,
            productId,
          );
          const existing = existingInventory[item.sku];

          if (!existing || shouldUpdateShopifyInventory(existing, next)) {
            inventoryUpserts.push(next);
          }
        }
      }

      // 4. Batch Update
      if (inventoryUpserts.length > 0) {
        await this.inventoryRepo.updateInventoryBatch(inventoryUpserts);
        this.logger.log(
          `Successfully synced ${inventoryUpserts.length} inventory records.`,
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
  private async processTiktokProducts(
    service: TikTokService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      this.logger.log(`Starting TikTok product sync for store ${store.id}`);

      /* ---------- 1. FETCH PRODUCTS ---------- */
      const products: Product202502SearchProductsResponseDataProducts[] =
        await service.getAllProducts(store.id);

      if (!products.length) {
        this.logger.warn('No TikTok products found. Skipping.');
        return;
      }

      /* ---------- 2. MAP + UPSERT PRODUCTS ---------- */
      const productRows = products.flatMap((p) =>
        mapTiktokProductToDB(p, store.id),
      );

      if (!productRows.length) return;

      await this.productsRepo.insertProducts(productRows);

      /* ---------- 3. SKU → PRODUCT ID MAP ---------- */
      const skus = [...new Set(productRows.map((p) => p.sku))];

      const productIdBySku =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          skus,
          'tiktok',
        );

      /* ---------- 4. FETCH EXISTING INVENTORY ---------- */
      const existingInventory = await this.inventoryRepo.getBySkus(
        skus,
        store.id,
      );

      /* ---------- 5. INVENTORY FETCH (≤ 50 IDS) ---------- */
      const productIds = [...new Set(products.map((p) => p.id!))];

      const inventoryUpserts: Database['public']['Tables']['inventory']['Insert'][] =
        [];

      for (let i = 0; i < productIds.length; i += 50) {
        const batch = productIds.slice(i, i + 50);

        const inventories: Product202309InventorySearchResponseDataInventory[] =
          await service.getProductInventories(store.id, batch);

        for (const inv of inventories) {
          for (const sku of inv.skus ?? []) {
            if (!sku.sellerSku) continue;

            const productId = productIdBySku.get(sku.sellerSku);
            if (!productId) continue;

            const next = mapTiktokInventoryToDB(inv, sku, store.id, productId);

            const existing = existingInventory[sku.sellerSku];

            if (!existing || shouldUpdateTiktokInventory(existing, next)) {
              inventoryUpserts.push(next);
            }
          }
        }
      }

      /* ---------- 6. UPSERT INVENTORY ---------- */
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
