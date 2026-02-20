import { chunk } from 'lodash';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformServiceFactory } from '../connectors/platform-factory.service';
import { OrdersRepository } from '../supabase/repositories/orders.repository';
import { OrderItemsRepository } from '../supabase/repositories/order_items.repository';
import { FulfillmentsRepository } from '../supabase/repositories/fulfillments.repository';
import { StoresRepository } from '../supabase/repositories/stores.repository';
import { ProductsRepository } from '../supabase/repositories/products.repository';
import { MetricsRepository } from '../supabase/repositories/metrics.repository';
import { StoreCredentialsService } from '../supabase/repositories/store_credentials.repository';
import { Database } from '../supabase/supabase.types';
import {
  mapOrdersToDB,
} from '../connectors/faire/faire.mapper';
import {
  mapFulfillmentToDB,
  mapOrderLinesToDB,
  mapOrderToDB,
  TargetFulfillment,
  TargetOrder,
} from '../connectors/target/target.mapper';
import {
  mapWalmartFulfillmentsToDB,
  mapWalmartOrderItemsToDB,
  mapWalmartOrderToDB,
} from '../connectors/walmart/walmart.mapper';
import {
  AmazonOrderReportRow,
  mapAmazonOrderItemToDB,
  mapAmazonOrderToDB,
  mapAmazonShipmentToDB,
  mapDailySalesToDB,
  mapFlatFileRowsToOrders,
  mapFlatFileRowToOrderItem,
  mapReportFulfillmentToDB,
  mapReportOrderItemToDB,
  mapReportOrderToDB,
} from '../connectors/amazon/amazon.mapper';
import {
  mapWarehanceOrderItemsToDB,
  mapWarehanceOrdersToDB,
  mapWarehanceShipmentsToDB,
} from '../connectors/warehouse/warehance.mapper';
import {
  mapShopifyFulfillmentsToDB,
  mapShopifyOrderItemsToDB,
  mapShopifyOrderToDB,
  mapShopifyPerformanceToDb,
  ShopifyFulfillmentOrderNode,
  ShopifyOrderNode,
} from '../connectors/shopify/shopify.mapper';
import { Order } from '../connectors/walmart/walmart.types';
import {
  ListOrdersResponse200,
  ListShipmentsResponse200,
} from '../../.api/apis/warehance-api';
import { AlertsRepository } from '../supabase/repositories/alerts.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { TikTokService } from '../connectors/tiktok/tiktok.service';
import {
  mapTiktokFulfillmentsToDB,
  mapTiktokOrderItemsToDB,
  mapTiktokOrderToDB,
  mapTikTokPerformanceToDb,
} from '../connectors/tiktok/tiktok.mapper';
import { ShopifyService } from '../connectors/shopify/shopify.service';
import { WarehanceService } from '../connectors/warehouse/warehance.service';
import { AmazonService } from '../connectors/amazon/amazon.service';
import { WalmartService } from '../connectors/walmart/walmart.service';
import { TargetService } from '../connectors/target/target.service';
import { FaireService } from '../connectors/faire/faire.service';
import { getOrders } from '../connectors/faire/faire.types';
import { deriveMetricsFromOrders } from '../common/mappers';

@Processor('orders', { concurrency: 5 })
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly platformFactory: PlatformServiceFactory,
    private readonly ordersRepo: OrdersRepository,
    private readonly orderItemsRepo: OrderItemsRepository,
    private readonly shipmentRepo: FulfillmentsRepository,
    private readonly storeRepo: StoresRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly metricsRepo: MetricsRepository,
    private readonly storeCredentialsService: StoreCredentialsService,
    private readonly alertsRepo: AlertsRepository,
    @InjectSupabaseClient()
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
      since?: string;
    } = job.data;

    if (!storeId) {
      throw new Error('storeId is required');
    }

    try {
      const store = await this.storeRepo.getStoreById(storeId);
      const credentials =
        await this.storeCredentialsService.getCredentialsByStoreId(storeId);

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
          `Service init failed: ${serviceError.message}`,
        );
        await this.alertsRepo.createAlert({
          store_id: storeId,
          alert_type: 'service_init_failure',
          message: `Failed to initialize ${platform} service: ${serviceError.message}`,
          severity: 'critical',
          platform,
        });
        throw serviceError;
      }

      switch (platform) {
        case 'faire':
          await this.processFaireOrders(service as FaireService, store);
          break;
        case 'target':
          await this.processTargetOrders(service as TargetService, store);
          break;
        case 'walmart':
          await this.processWalmartOrders(service as WalmartService, store);
          break;
        case 'amazon':
          await this.processAmazonOrders(service as AmazonService, store);
          break;
        case 'shopify':
          await this.processShopifyOrders(service as ShopifyService, store);
          break;
        case 'warehance':
          await this.processWarehanceOrders(service as WarehanceService, store);
          break;
        case 'tiktok':
          await this.processTiktokOrders(service as TikTokService, store);
          break;
      }

      // Update store health on success
      await this.storeRepo.updateStoreHealth(storeId, 'healthy');
      await this.supabaseClient
        .from('stores')
        .update({
          last_synced_at: new Date().toISOString(),
          last_orders_synced_at: new Date().toISOString(),
        })
        .eq('id', store.id);
    } catch (error) {
      this.logger.error(`Orders job failed for store ${storeId}`, error.stack);
      await this.storeRepo.updateStoreHealth(
        storeId,
        'unhealthy',
        `Orders sync failed: ${error.message}`,
      );
      await this.alertsRepo.createAlert({
        store_id: storeId,
        alert_type: 'order_sync_failure',
        message: `${platform} orders sync failed: ${error.message}`,
        severity: 'high',
        platform,
      });
      throw error;
    }
  }

  private async processFaireOrders(
    service: FaireService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch all products for this store
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap = new Map<string, string>(); // external_id -> internal id
      products.forEach((p) => productMap.set(p.external_product_id, p.id));

      // 2️⃣ Fetch orders from Faire
      const orders: getOrders['orders'] = await service.getAllOrders();
      if (!orders || orders.length === 0) {
        this.logger.warn('No orders fetched from Faire');
        return;
      }

      // 3️⃣ Map orders (with external IDs) for DB insertion
      const {
        orders: rawOrders,
        orderItems: rawItems,
        shipments: rawShipments,
      } = mapOrdersToDB(orders, store.id);

      if (rawOrders.length === 0) return;

      // 4️⃣ Insert orders and capture internal IDs
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(rawOrders);

      // Build a map: external_order_id -> internal database id
      const orderIdMap = new Map<string, string>();
      insertedOrders?.forEach(
        (order: Database['public']['Tables']['orders']['Row']) =>
          orderIdMap.set(order.external_order_id, order.id),
      );

      // 5️⃣ Map order_items to internal order_id + internal product_id
      const orderItemsDB: Database['public']['Tables']['order_items']['Insert'][] =
        rawItems
          .filter((item) => orderIdMap.has(item.order_id))
          .map((item) => ({
            ...item,
            order_id: orderIdMap.get(item.order_id)!,
            product_id: item.product_id
              ? (productMap.get(item.product_id) ?? null)
              : null,
          }));

      // 6️⃣ Map shipments to internal order_id + internal product_id
      const shipmentsDB: Database['public']['Tables']['fulfillments']['Insert'][] =
        rawShipments
          .filter((shipment) => orderIdMap.has(shipment.order_id))
          .map((shipment) => ({
            ...shipment,
            order_id: orderIdMap.get(shipment.order_id)!,
            product_id: shipment.product_id
              ? (productMap.get(shipment.product_id) ?? null)
              : null,
          }));

      // 7️⃣ Insert order items
      await this.orderItemsRepo.bulkUpsertOrderItems(orderItemsDB);

      // 8️⃣ Insert shipments
      await this.shipmentRepo.insertShipments(shipmentsDB);

      // 9 Map Metrics and Insert
      const metrics = deriveMetricsFromOrders({
        orders: insertedOrders,
        orderItems: orderItemsDB,
        fulfillments: shipmentsDB,
        platform: 'faire',
        storeId: store.id,
      });

      if (metrics.length) {
        await this.metricsRepo.bulkUpsertMetrics(metrics);
      }
      this.logger.log(
        `Successfully synced ${rawOrders.length} orders, ${orderItemsDB.length} items, ${shipmentsDB.length} shipments`,
      );
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} orders failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Orders sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'order_sync_failure',
        message: `${store.platform.toUpperCase()} orders sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }

  private async processTargetOrders(
    service: TargetService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_orders_synced_at
        ? new Date(store.last_orders_synced_at).toISOString()
        : undefined;

      // 1️⃣ Fetch all products for this store -> build productMap: external_product_id -> product.id
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap: Record<string, string> = {};
      products.forEach((p) => {
        if (p.external_product_id) productMap[p.external_product_id] = p.id;
      });

      // 2️⃣ Fetch orders from Target
      const orders: TargetOrder[] = await service.getAllOrders({ since });
      if (!orders?.length) {
        this.logger.warn('No orders fetched from Target');
        return;
      }

      // 3️⃣ Map orders -> DB insert objects (orders only)
      const dbOrders = orders.map((o) => mapOrderToDB(o, store.id));

      // 4️⃣ Insert orders and capture internal IDs
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(dbOrders);
      if (!insertedOrders || !insertedOrders.length) {
        throw new Error('Failed to insert orders or no rows returned');
      }

      // Build map: external_order_id -> internal orders.id
      const externalToInternalOrderId = new Map<string, string>();
      insertedOrders.forEach(
        (row: Database['public']['Tables']['orders']['Row']) => {
          // row.external_order_id should exist
          if (row.external_order_id && row.id) {
            externalToInternalOrderId.set(row.external_order_id, row.id);
          }
        },
      );

      // 5️⃣ Map order_items to internal order_id + internal product_id
      const dbOrderItems: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      for (const order of orders) {
        const internalOrderId = externalToInternalOrderId.get(order.id);
        if (!internalOrderId) {
          // Skip mapping items for orders that didn't upsert correctly
          this.logger.warn(
            `No internal id for external order ${order.id}, skipping items`,
          );
          continue;
        }

        const items = mapOrderLinesToDB(
          internalOrderId,
          order.order_lines,
          productMap,
        );
        dbOrderItems.push(...items);
      }

      // 6️⃣ Map shipments (fulfillments) to internal order_id + external_fulfillment_id
      const dbFulfillments: Database['public']['Tables']['fulfillments']['Insert'][] =
        [];
      for (const order of orders) {
        const internalOrderId = externalToInternalOrderId.get(order.id);
        if (!internalOrderId) {
          this.logger.warn(
            `No internal id for external order ${order.id}, skipping fulfillments`,
          );
          continue;
        }

        // Fetch fulfillments for this external order id
        let fulfills: TargetFulfillment[] = [];
        try {
          fulfills = await service.getOrderFulfillments(order.id);
        } catch (err) {
          this.logger.error(
            `Failed to fetch fulfillments for order ${order.id}`,
            err,
          );
          continue; // proceed with other orders
        }

        // Build a map order_line_number -> SKU for this order
        const lineNumberToSku = new Map<string, string>();
        (order.order_lines || []).forEach((line) =>
          lineNumberToSku.set(line.order_line_number, line.external_id),
        );

        // Map each fulfillment to DB row
        for (const f of fulfills) {
          const sku = lineNumberToSku.get(f.order_line_number) ?? null;
          const productId = sku ? (productMap[sku] ?? null) : null;
          const dbRow = mapFulfillmentToDB(
            {
              id: f.id,
              order_id: f.order_id,
              order_line_number: f.order_line_number,
              quantity: f.quantity,
              shipping_method: f.shipping_method,
              tracking_number: f.tracking_number,
              shipped_date: (f as any).shipped_date ?? f.created,
              created: f.created,
              created_by: f.created_by,
              last_modified: f.last_modified,
              last_modified_by: f.last_modified_by,
            } as TargetFulfillment,
            internalOrderId,
            productId,
            store.id,
          );
          dbFulfillments.push(dbRow);
        }
      }

      // 7️⃣ Insert order items
      if (dbOrderItems.length) {
        await this.orderItemsRepo.bulkUpsertOrderItems(dbOrderItems);
      } else {
        this.logger.log('No order items to insert for this run');
      }

      // 8️⃣ Insert shipments
      if (dbFulfillments.length) {
        await this.shipmentRepo.insertShipments(dbFulfillments);
      } else {
        this.logger.log('No fulfillments to insert for this run');
      }

      // Map Metrics and Insert
      const metrics = deriveMetricsFromOrders({
        orders: insertedOrders,
        orderItems: dbOrderItems,
        fulfillments: dbFulfillments,
        platform: 'target',
        storeId: store.id,
      });

      if (metrics.length) {
        await this.metricsRepo.bulkUpsertMetrics(metrics);
      }

      this.logger.log(
        `Target orders sync complete: ${insertedOrders.length} orders, ${dbOrderItems.length} items, ${dbFulfillments.length} fulfillments`,
      );
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} orders failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Orders sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'order_sync_failure',
        message: `${store.platform.toUpperCase()} orders sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }

  private async processWalmartOrders(
    service: WalmartService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_orders_synced_at
        ? new Date(store.last_orders_synced_at).toISOString()
        : undefined;

      // 1️⃣ Products → productId map
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap = new Map(
        products.map((p) => [p.external_product_id, p.id]),
      );

      // 2️⃣ Orders
      const response = await service.getOrders(since);
      const orders: Order[] = response ?? [];
      if (!orders.length) return;

      // 3️⃣ Orders → DB
      const dbOrders = orders.map((o) => mapWalmartOrderToDB(o, store.id));
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(dbOrders);

      if (!insertedOrders || !insertedOrders.length) {
        throw new Error('Failed to insert Walmart orders or no rows returned');
      }

      const orderIdByExternal = new Map(
        insertedOrders.map((o) => [o.external_order_id, o.id]),
      );

      const orderItems: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      const fulfillments: Database['public']['Tables']['fulfillments']['Insert'][] =
        [];

      // 4️⃣ Items + Fulfillments
      for (const order of orders) {
        const orderId = orderIdByExternal.get(order.purchaseOrderId);
        if (!orderId) continue;

        for (const line of order.orderLines.orderLine ?? []) {
          const productId = productMap.get(line.item.sku);

          orderItems.push(mapWalmartOrderItemsToDB(line, orderId, productId));

          const fulfillment = mapWalmartFulfillmentsToDB(
            line,
            orderId,
            store.id,
            productId,
          );
          if (fulfillment) fulfillments.push(fulfillment);
        }
      }

      // 5️⃣ Persist children
      if (orderItems.length)
        await this.orderItemsRepo.bulkUpsertOrderItems(orderItems);

      if (fulfillments.length)
        await this.shipmentRepo.insertShipments(fulfillments);

      // 6 Map Metrics and Insert
      const metrics = deriveMetricsFromOrders({
        orders: insertedOrders,
        orderItems,
        fulfillments,
        platform: 'walmart',
        storeId: store.id,
      });

      if (metrics.length) {
        await this.metricsRepo.bulkUpsertMetrics(metrics);
      }

      this.logger.log(
        `Walmart orders synced: ${insertedOrders.length} orders, ${orderItems.length} items, ${fulfillments.length} fulfillments`,
      );
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} orders failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Orders sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'order_sync_failure',
        message: `${store.platform.toUpperCase()} orders sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }
  private async processAmazonOrders(
    service: AmazonService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const isFirstSync = !store.last_orders_synced_at;

      const products = await this.productsRepo.getAllProductsByStore(store.id);

      const productMap = new Map<string, string>();
      for (const p of products) {
        if (p.external_product_id) productMap.set(p.external_product_id, p.id);
        if (p.sku) productMap.set(p.sku, p.id);
        if (p.asin) productMap.set(p.asin, p.id);
      }

      let ordersPayload: any[] = [];
      let itemsPayload: any[] = [];
      let shipmentsPayload: any[] = [];

      // ============================================================
      // 1️⃣ FULL SYNC (REPORT)
      // ============================================================
      if (isFirstSync) {
        const rows = await service.getOrdersFlatFileReport(store);

        ordersPayload = mapFlatFileRowsToOrders(rows, store.id);

        for (const row of rows) {
          const productId =
            productMap.get(row['asin']) || productMap.get(row['sku']) || null;

          itemsPayload.push({
            ...mapFlatFileRowToOrderItem(
              row,
              row['amazon-order-id'],
              productId,
            ),
            external_order_id: row['amazon-order-id'], // REQUIRED FOR FK JOIN
          });
        }
      }

      // ============================================================
      // 2️⃣ INCREMENTAL SYNC (API)
      // ============================================================
      else {
        const since = new Date(store.last_orders_synced_at!).toISOString();

        const orders = await service.getOrders(store, since);

        if (!orders.length) {
          this.logger.log('No Amazon orders returned');
          return;
        }

        const orderWithItems = await Promise.all(
          orders.map(async (order) => {
            await new Promise((r) => setTimeout(r, 2500));
            const items = await service.getOrderItems(order.AmazonOrderId);
            return { order, items };
          }),
        );

        for (const { order, items } of orderWithItems) {
          const dbOrder = mapAmazonOrderToDB(
            order,
            store.id,
            store.platform,
            items,
          );

          ordersPayload.push(dbOrder);

          for (const item of items) {
            const productId =
              productMap.get(item.ASIN) ||
              productMap.get(item.SellerSKU!) ||
              null;

            itemsPayload.push({
              ...mapAmazonOrderItemToDB(item, order.AmazonOrderId, productId),
              external_order_id: order.AmazonOrderId, // REQUIRED
            });

            const fulfillment = mapAmazonShipmentToDB(
              order,
              item,
              store.id,
              order.AmazonOrderId,
              productId ?? undefined,
            );

            if (fulfillment) {
              shipmentsPayload.push({
                ...fulfillment,
                external_order_id: order.AmazonOrderId, // REQUIRED
                store_id: store.id, // REQUIRED BY RPC
                platform: store.platform, // REQUIRED BY RPC
              });
            }
          }
        }

        this.logger.log(
          `Amazon orders fetched: ${ordersPayload.length} orders`,
        );
      }

      // ============================================================
      // 3️⃣ CHUNKED RPC SYNC
      // ============================================================
      const ORDER_CHUNK = 500;
      const orderChunks = chunk(ordersPayload, ORDER_CHUNK);

      for (const orderChunk of orderChunks) {
        const orderIds = new Set(orderChunk.map((o) => o.external_order_id));

        const filteredItems = itemsPayload.filter((i) =>
          orderIds.has(i.external_order_id),
        );

        const filteredShipments = shipmentsPayload.filter((s) =>
          orderIds.has(s.external_order_id),
        );

        await this.ordersRepo.syncOrderData(
          orderChunk,
          filteredItems,
          filteredShipments,
        );
      }

      // GET METRICS
      const dailyData = await service.getDailySalesMetrics(store);

      if (dailyData?.length) {
        const allMetrics = mapDailySalesToDB(dailyData, store.id);
        if (allMetrics.length) {
          await this.metricsRepo.bulkUpsertMetrics(allMetrics);
        }
      }

      // ============================================================
      // 4️⃣ UPDATE CURSOR
      // ============================================================
      await this.storeRepo.update(store.id, 'orders', {
        last_synced_at: new Date().toISOString(),
      });

      this.logger.log(
        `Amazon orders sync completed: ${ordersPayload.length} orders`,
      );
    } catch (error: any) {
      this.logger.error(
        `AMAZON orders failed for store ${store.id}`,
        error.stack,
      );
      throw error;
    }
  }

  private async processWarehanceOrders(
    service: WarehanceService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    const syncStart = new Date();
    const since = store.last_orders_synced_at
      ? new Date(store.last_orders_synced_at).toISOString()
      : undefined;

    try {
      this.logger.log(
        `Starting Warehance orders sync for store ${store.id} (incremental: ${!!since})`,
      );

      // Fetch products for mapping (not incremental – assume products job handles it)
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productIdByExternalId = new Map(
        products.map((p) => [p.external_product_id, p.id]),
      );
      const productIdBySku = new Map(products.map((p) => [p.sku, p.id]));

      // Fetch Orders (incremental)
      const ordersResponse: ListOrdersResponse200['data'] =
        await service.getOrders(since);
      const orders = ordersResponse?.orders ?? [];

      if (!orders.length) {
        this.logger.log('No orders found');
        return;
      }

      // Map Orders
      const orderInserts = mapWarehanceOrdersToDB(
        ordersResponse,
        store.id,
        store.platform,
      );

      // Insert Orders & capture IDs
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(orderInserts);

      if (!insertedOrders?.length) {
        throw new Error(
          'Failed to insert Warehance orders or no rows returned',
        );
      }

      const orderIdByExternalId = new Map(
        insertedOrders.map((o) => [o.external_order_id, o.id!]),
      );

      // Map Order Items + deduplication
      const orderItemInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      const seen = new Set<string>();

      for (const order of orders) {
        const internalOrderId = orderIdByExternalId.get(String(order.id));
        if (!internalOrderId) continue;

        const newItems = mapWarehanceOrderItemsToDB(
          order,
          internalOrderId,
          productIdBySku,
        );

        for (const item of newItems) {
          const key = `${item.order_id}|${item.sku}`;
          if (seen.has(key)) {
            this.logger.debug(`Duplicate item skipped: ${key}`);
            continue;
          }
          seen.add(key);
          orderItemInserts.push(item);
        }
      }

      this.logger.log(
        `After deduplication: ${orderItemInserts.length} unique items`,
      );

      // Bulk Upsert Order Items
      await this.orderItemsRepo.bulkUpsertOrderItems(orderItemInserts);

      // Fetch Shipments (incremental)
      const shipmentsResponse: ListShipmentsResponse200['data'] =
        await service.getShipments(since);

      // Map Shipments
      const fulfillmentInserts = mapWarehanceShipmentsToDB(
        shipmentsResponse,
        store.id,
        store.platform,
        orderIdByExternalId,
        productIdByExternalId,
      );

      // Insert Fulfillments
      await this.shipmentRepo.insertShipments(fulfillmentInserts);

      // Map Metrics and Insert
      const metrics = deriveMetricsFromOrders({
        orders: insertedOrders,
        orderItems: orderItemInserts,
        fulfillments: fulfillmentInserts,
        platform: 'warehance',
        storeId: store.id,
      });

      if (metrics.length) {
        await this.metricsRepo.bulkUpsertMetrics(metrics);
      }

      const duration = (Date.now() - syncStart.getTime()) / 1000;
      this.logger.log(
        `Warehance orders sync complete: ${orderInserts.length} orders, ${orderItemInserts.length} items, ${fulfillmentInserts.length} fulfillments in ${duration}s`,
      );
    } catch (error) {
      const duration = (Date.now() - syncStart.getTime()) / 1000;

      this.logger.error(
        `Warehance orders sync failed for store ${store.id} after ${duration}s`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Orders sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'order_sync_failure',
        message: `Warehance orders sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }

  private async processShopifyOrders(
    service: ShopifyService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_orders_synced_at
        ? new Date(store.last_orders_synced_at).toISOString()
        : undefined;

      // 1. Reference Data for Mapping
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productIdBySku = new Map(products.map((p) => [p.sku, p.id]));

      // 2. Fetch & Insert Orders
      const shopifyOrders: ShopifyOrderNode[] =
        await service.fetchOrders(since);
      if (!shopifyOrders.length) return;

      const orderInserts = shopifyOrders.map((o) =>
        mapShopifyOrderToDB(o, store.id),
      );
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(orderInserts);

      if (!insertedOrders) throw new Error(`Failed to persist orders`);

      const orderIdByExternalId = new Map(
        insertedOrders.map((o) => [o.external_order_id, o.id!]),
      );

      // 3. Map & Insert Order Items
      const orderItemInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      for (const orderNode of shopifyOrders) {
        const internalId = orderIdByExternalId.get(orderNode.id);
        if (internalId) {
          orderItemInserts.push(
            ...mapShopifyOrderItemsToDB(
              orderNode.lineItems.nodes,
              internalId,
              productIdBySku,
            ),
          );
        }
      }

      if (orderItemInserts.length > 0) {
        await this.orderItemsRepo.bulkUpsertOrderItems(orderItemInserts);
      }

      // 4. Fulfillment Sync
      const fulfillmentNodes: ShopifyFulfillmentOrderNode[] =
        await service.fetchFulfillments();
      if (fulfillmentNodes.length > 0) {
        const fulfillmentInserts = mapShopifyFulfillmentsToDB(
          fulfillmentNodes,
          store.id,
          orderIdByExternalId,
          productIdBySku,
        );

        if (fulfillmentInserts.length > 0) {
          await this.shipmentRepo.insertShipments(fulfillmentInserts);
        }
      }

      // 4. Metrics Sync
      const metrics = await service.fetchDailyMetrics();
      const metricsInserts = mapShopifyPerformanceToDb(metrics, store.id);

      if (metricsInserts.length > 0) {
        await this.metricsRepo.bulkUpsertMetrics(metricsInserts);
      }

      this.logger.log(
        `${store.platform} sync successful: ${insertedOrders.length} orders processed.`,
      );
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} orders failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Orders sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'order_sync_failure',
        message: `${store.platform.toUpperCase()} orders sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }

  private async processTiktokOrders(
    service: TikTokService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    const since = store.last_orders_synced_at
      ? Math.floor(new Date(store.last_orders_synced_at).getTime() / 1000)
      : undefined;

    try {
      /* ---------- 1. Reference products (SKU → product_id) ---------- */
      const products = await this.productsRepo.getAllProductsByStore(store.id);

      const productIdBySku = new Map<string, string>(
        products.map((p) => [p.sku, p.id]),
      );

      /* ---------- 2. Fetch orders ---------- */
      const orders = await service.getAllOrders(store.id, since);

      if (!orders?.length) {
        this.logger.log(`[TikTok] No orders to sync for store ${store.id}`);
        return;
      }

      /* ---------- 3. Upsert orders ---------- */
      const orderInserts = orders.map((o) => mapTiktokOrderToDB(o, store.id));

      const { data: persistedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(orderInserts);

      if (!persistedOrders?.length) {
        throw new Error('Orders upsert returned no rows');
      }

      const orderIdByExternalId = new Map<string, string>(
        persistedOrders.map((o) => [o.external_order_id, o.id!]),
      );

      /* ---------- 4. Order items + lineItem → product map ---------- */
      const orderItemInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];

      const lineItemProductMap = new Map<string, string | null>();

      for (const order of orders) {
        const orderId = orderIdByExternalId.get(order.id!);
        if (!orderId) continue;

        for (const li of order.lineItems ?? []) {
          const sku: string =
            (li.sellerSku as string) ??
            (li.skuId as string) ??
            (li.combinedListingSkus?.[0]?.sellerSku as string);

          const productId = sku ? (productIdBySku.get(sku) ?? null) : null;

          if (li.id) {
            lineItemProductMap.set(li.id, productId);
          }

          orderItemInserts.push({
            order_id: orderId,
            external_line_item_id: li.id ?? null,
            sku,
            product_id: productId,
            quantity: 1,
            price: Number(li.salePrice ?? li.originalPrice ?? '0'),
            total: Number(li.salePrice ?? li.originalPrice ?? '0'),
            fulfilled_quantity: 0,
            refunded_quantity: 0,
          });
        }
      }

      if (orderItemInserts.length) {
        await this.orderItemsRepo.bulkUpsertOrderItems(orderItemInserts);
      }

      /* ---------- 5. Fulfillments ---------- */
      const packages = await service.getAllFulfillments(store.id, since);

      if (packages?.length) {
        const fulfillmentInserts = mapTiktokFulfillmentsToDB(
          packages,
          store,
          orderIdByExternalId,
          lineItemProductMap,
        );

        if (fulfillmentInserts.length) {
          await this.shipmentRepo.insertShipments(fulfillmentInserts);
        }
      }

      /* ---------- 6. Analytics ---------- */
      const analytics = await service.getDailyGMV(store.id);

      if (analytics?.length) {
        const analyticsInserts = mapTikTokPerformanceToDb(analytics, store.id);

        if (analyticsInserts.length) {
          await this.metricsRepo.bulkUpsertMetrics(analyticsInserts);
        }
      }

      this.logger.log(
        `[TikTok] Orders sync complete — ${persistedOrders.length} orders`,
      );
    } catch (error) {
      this.logger.error(
        `[TikTok] Orders sync failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Orders sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'order_sync_failure',
        message: `TikTok orders sync failed: ${error.message}`,
        severity: 'high',
        platform: 'tiktok',
      });

      throw error;
    }
  }
}
