import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformServiceFactory } from 'src/connectors/platform-factory.service';
import { OrdersRepository } from 'src/supabase/repositories/orders.repository';
import { OrderItemsRepository } from 'src/supabase/repositories/order_items.repository';
import { FulfillmentsRepository } from 'src/supabase/repositories/fulfillments.repository';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { ProductsRepository } from 'src/supabase/repositories/products.repository';
import { StoreCredentialsService } from 'src/supabase/repositories/store_credentials.repository';
import { Database } from 'src/supabase/supabase.types';
import {
  Order as AmazonOrder,
  OrderItem as AmazonOrderItem,
} from '@sp-api-sdk/orders-api-v0';
import { FaireOrder, mapOrdersToDB } from 'src/connectors/faire/faire.mapper';
import {
  mapFulfillmentToDB,
  mapOrderLinesToDB,
  mapOrderToDB,
  TargetFulfillment,
  TargetOrder,
} from 'src/connectors/target/target.mapper';
import {
  mapWalmartFulfillmentsToDB,
  mapWalmartOrderItemsToDB,
  mapWalmartOrderToDB,
} from 'src/connectors/walmart/walmart.mapper';
import {
  mapAmazonOrderItemToDB,
  mapAmazonOrderToDB,
  mapAmazonShipmentToDB,
} from 'src/connectors/amazon/amazon.mapper';
import {
  mapWarehanceOrderItemsToDB,
  mapWarehanceOrdersToDB,
  mapWarehanceShipmentsToDB,
} from 'src/connectors/warehouse/warehance.mapper';
import {
  mapShopifyFulfillmentsToDB,
  mapShopifyOrderItemsToDB,
  mapShopifyOrderToDB,
  ShopifyFulfillmentOrderNode,
  ShopifyOrderNode,
} from 'src/connectors/shopify/shopify.mapper';
import { Order } from 'src/connectors/walmart/walmart.types';
import {
  ListOrdersResponse200,
  ListShipmentsResponse200,
} from '.api/apis/warehance-api';
import { AlertsRepository } from 'src/supabase/repositories/alerts.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';

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
      since,
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
        service = this.platformFactory.createService(
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
          await this.processFaireOrders(service, store);
          break;
        case 'target':
          await this.processTargetOrders(service, store);
          break;
        case 'walmart':
          await this.processWalmartOrders(service, store);
          break;
        case 'amazon':
          await this.processAmazonOrders(service, store);
          break;
        case 'shopify':
          await this.processShopifyOrders(service, store);
          break;
        case 'warehance':
          await this.processWarehanceOrders(service, store);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Update store health on success
      await this.storeRepo.updateStoreHealth(storeId, 'healthy');
      await this.supabaseClient
        .from('stores')
        .update({ last_synced_at: new Date().toISOString() })
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
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch all products for this store
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap = new Map<string, string>(); // external_id -> internal id
      products.forEach((p) => productMap.set(p.external_product_id, p.id));

      // 2️⃣ Fetch orders from Faire
      const { orders }: { orders: FaireOrder[] } = await service.getOrders();
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
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch all products for this store -> build productMap: external_product_id -> product.id
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap: Record<string, string> = {};
      products.forEach((p) => {
        if (p.external_product_id) productMap[p.external_product_id] = p.id;
      });

      // 2️⃣ Fetch orders from Target
      const orders: TargetOrder[] = await service.getAllOrders();
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
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_synced_at
        ? new Date(store.last_synced_at).toISOString()
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
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // Get since parameter for incremental sync
      const since = store.last_synced_at
        ? new Date(store.last_synced_at).toISOString()
        : undefined;

      // 1️⃣ Products → productId map
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap = new Map(
        products.map((p) => [p.external_product_id, p.id]),
      );

      // 2️⃣ Orders with incremental sync
      const orders: AmazonOrder[] = await service.getOrders(store, since);
      if (!orders.length) {
        this.logger.log('No new Amazon orders to sync');
        return;
      }

      // 3️⃣ Orders → DB
      const dbOrders = orders.map((o) =>
        mapAmazonOrderToDB(o, store.id, store.platform),
      );
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(dbOrders);

      if (!insertedOrders || !insertedOrders.length) {
        throw new Error('Failed to insert Amazon orders or no rows returned');
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
        const orderId = orderIdByExternal.get(order.AmazonOrderId);
        if (!orderId) continue;

        // Fetch order items
        const items: AmazonOrderItem[] = await service.getOrderItems(
          order.AmazonOrderId,
        );

        for (const item of items) {
          const productId =
            productMap.get(item.ASIN) ||
            productMap.get(item.SellerSKU!) ||
            undefined;

          orderItems.push(mapAmazonOrderItemToDB(item, orderId, productId));

          const fulfillment = mapAmazonShipmentToDB(
            order,
            item,
            store.id,
            orderId,
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

      this.logger.log(
        `Amazon orders synced: ${insertedOrders.length} orders, ${orderItems.length} items, ${fulfillments.length} fulfillments`,
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

  private async processWarehanceOrders(
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    const syncStart = new Date();
    const since = store.last_synced_at
      ? new Date(store.last_synced_at).toISOString()
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
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1. Reference Data for Mapping
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productIdByExternalId = new Map(
        products.map((p) => [p.external_product_id, p.id]),
      );
      const productIdBySku = new Map(products.map((p) => [p.sku, p.id]));

      // 2. Fetch & Insert Orders
      const shopifyOrders: ShopifyOrderNode[] = await service.fetchOrders();
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
          productIdByExternalId,
        );

        if (fulfillmentInserts.length > 0) {
          await this.shipmentRepo.insertShipments(fulfillmentInserts);
        }
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
}
