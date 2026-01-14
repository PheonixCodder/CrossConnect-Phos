import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FaireService } from 'src/connectors/faire/faire.service';
import { OrdersRepository } from 'src/supabase/repositories/orders.repository';
import { OrderItemsRepository } from 'src/supabase/repositories/order_items.repository';
import { FulfillmentsRepository } from 'src/supabase/repositories/fulfillments.repository';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { ProductsRepository } from 'src/supabase/repositories/products.repository';
import { mapOrdersToDB } from 'src/connectors/faire/faire.mapper';
import { Database } from 'src/supabase/supabase.types';
import { TargetService } from 'src/connectors/target/target.service';
import {
  mapFulfillmentToDB,
  mapOrderLinesToDB,
  mapOrderToDB,
  TargetFulfillment,
  TargetOrder,
} from 'src/connectors/target/target.mapper';
import { WalmartService } from 'src/connectors/walmart/walmart.service';
import {
  mapWalmartFulfillmentsToDB,
  mapWalmartOrderItemsToDB,
  mapWalmartOrderToDB,
} from 'src/connectors/walmart/walmart.mapper';
import { AmazonService } from 'src/connectors/amazon/amazon.service';
import {
  mapAmazonOrderItemToDB,
  mapAmazonOrderToDB,
  mapAmazonShipmentToDB,
} from 'src/connectors/amazon/amazon.mapper';
import { WarehanceService } from 'src/connectors/warehouse/warehance.service';
import {
  mapWarehanceOrderItemsToDB,
  mapWarehanceOrdersToDB,
  mapWarehanceShipmentsToDB,
} from 'src/connectors/warehouse/warehance.mapper';

@Processor('orders', { concurrency: 5 })
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly faireService: FaireService,
    private readonly targetService: TargetService,
    private readonly ordersRepo: OrdersRepository,
    private readonly orderItemsRepo: OrderItemsRepository,
    private readonly shipmentRepo: FulfillmentsRepository,
    private readonly storeRepo: StoresRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly walmartService: WalmartService,
    private readonly amazonService: AmazonService,
    private readonly warehanceService: WarehanceService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const platform = job.data.platform as string;
    if (platform === 'faire') {
      // 1️⃣ Fetch store
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId)
        throw new Error(`Store not found for platform: ${platform}`);

      // 2️⃣ Fetch all products for this store
      const products = await this.productsRepo.getAllProductsByStore(storeId);
      const productMap = new Map<string, string>(); // external_id -> internal id
      products.forEach((p) => productMap.set(p.external_product_id, p.id));

      // 3️⃣ Fetch orders from Faire
      const { orders } = await this.faireService.getOrders();
      if (!orders || orders.length === 0) {
        this.logger.warn('No orders fetched from Faire');
        return;
      }

      // 4️⃣ Map orders (with external IDs) for DB insertion
      const {
        orders: rawOrders,
        orderItems: rawItems,
        shipments: rawShipments,
      } = mapOrdersToDB(orders, storeId);

      if (rawOrders.length === 0) return;

      // 5️⃣ Insert orders and capture internal IDs
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(rawOrders);

      // Build a map: external_order_id -> internal database id
      const orderIdMap = new Map<string, string>();
      insertedOrders?.forEach(
        (order: Database['public']['Tables']['orders']['Row']) =>
          orderIdMap.set(order.external_order_id, order.id),
      );

      // 6️⃣ Map order_items to internal order_id + internal product_id
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

      // 7️⃣ Map shipments to internal order_id + internal product_id
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

      // 8️⃣ Insert order items
      const { error: itemsError } =
        await this.orderItemsRepo.insertOrderItems(orderItemsDB);
      if (itemsError) throw itemsError;

      // 9️⃣ Insert shipments
      const { error: shipmentsError } =
        await this.shipmentRepo.insertShipments(shipmentsDB);
      if (shipmentsError) throw shipmentsError;

      this.logger.log(
        `Successfully synced ${rawOrders.length} orders, ${orderItemsDB.length} items, ${shipmentsDB.length} shipments`,
      );
    }
    if (platform === 'target') {
      // 1️⃣ Fetch store
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId)
        throw new Error(`Store not found for platform: ${platform}`);

      // 2️⃣ Fetch all products for this store -> build productMap: external_product_id -> product.id
      const products = await this.productsRepo.getAllProductsByStore(storeId);
      const productMap: Record<string, string> = {};
      products.forEach((p) => {
        if (p.external_product_id) productMap[p.external_product_id] = p.id;
      });

      // 3️⃣ Fetch orders from Target
      const orders: TargetOrder[] = await this.targetService.getAllOrders();
      if (!orders?.length) {
        this.logger.warn('No orders fetched from Target');
        return;
      }

      // 4️⃣ Map orders -> DB insert objects (orders only)
      const dbOrders = orders.map((o) => mapOrderToDB(o, storeId));

      // 5️⃣ Insert orders and capture internal IDs
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

      // 6️⃣ Map order_items to internal order_id + internal product_id
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

      // 7️⃣ Map shipments (fulfillments) to internal order_id + external_fulfillment_id
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

        // Fetch fulfillments for this external order id (Target API uses order.id)
        let fulfills: TargetFulfillment[] = [];
        try {
          fulfills = await this.targetService.getOrderFulfillments(order.id);
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
            storeId,
          );
          dbFulfillments.push(dbRow);
        }
      }

      // 8️⃣ Insert order items
      if (dbOrderItems.length) {
        await this.orderItemsRepo.insertOrderItems(dbOrderItems);
      } else {
        this.logger.log('No order items to insert for this run');
      }

      // 9️⃣ Insert shipments
      if (dbFulfillments.length) {
        const { error: shipmentsError } =
          await this.shipmentRepo.insertShipments(dbFulfillments);
        if (shipmentsError) throw shipmentsError;
      } else {
        this.logger.log('No fulfillments to insert for this run');
      }

      this.logger.log(
        `target orders sync complete: ${insertedOrders.length} orders, ${dbOrderItems.length} items, ${dbFulfillments.length} fulfillments`,
      );
    }
    if (platform === 'walmart') {
      // 1️⃣ Store
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) throw new Error(`Store not found for ${platform}`);

      // 2️⃣ Products → productId map
      const products = await this.productsRepo.getAllProductsByStore(storeId);
      const productMap = new Map(
        products.map((p) => [p.external_product_id, p.id]),
      );

      // 3️⃣ Orders
      const response = await this.walmartService.getOrders();
      const orders = response ?? [];
      if (!orders.length) return;

      // 4️⃣ Orders → DB
      const dbOrders = orders.map((o) => mapWalmartOrderToDB(o, storeId));
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

      // 5️⃣ Items + Fulfillments
      for (const order of orders) {
        const orderId = orderIdByExternal.get(order.purchaseOrderId);
        if (!orderId) continue;

        for (const line of order.orderLines.orderLine ?? []) {
          const productId = productMap.get(line.item.sku);

          orderItems.push(mapWalmartOrderItemsToDB(line, orderId, productId));

          const fulfillment = mapWalmartFulfillmentsToDB(
            line,
            orderId,
            storeId,
            productId,
          );
          if (fulfillment) fulfillments.push(fulfillment);
        }
      }

      // 6️⃣ Persist children
      if (orderItems.length)
        await this.orderItemsRepo.insertOrderItems(orderItems);

      if (fulfillments.length)
        await this.shipmentRepo.insertShipments(fulfillments);

      this.logger.log(
        `Walmart orders synced: ${insertedOrders.length} orders, ${orderItems.length} items, ${fulfillments.length} fulfillments`,
      );
    }

    if (platform === 'amazon') {
      // ------------------------------
      // 1️⃣ Fetch store
      // ------------------------------
      const store = await this.storeRepo.getStore(platform);
      if (!store) throw new Error(`Store not found for platform: ${platform}`);

      // ------------------------------
      // 2️⃣ Fetch all products for this store -> external_product_id -> product.id
      // ------------------------------
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap: Record<string, string> = {};
      products.forEach((p) => {
        if (p.external_product_id) productMap[p.external_product_id] = p.id!;
      });

      // ------------------------------
      // 3️⃣ Fetch orders from Amazon
      // ------------------------------
      const orders = await this.amazonService.getOrders(store);
      if (!orders?.length) {
        this.logger.warn('No orders fetched from Amazon');
        return;
      }

      // ------------------------------
      // 4️⃣ Map orders -> DB insert objects
      // ------------------------------
      const orderInserts = orders.map((o) =>
        mapAmazonOrderToDB(o, store.id, platform),
      );

      // ------------------------------
      // 5️⃣ Insert orders & capture internal IDs
      // ------------------------------
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(orderInserts);

      if (!insertedOrders || !insertedOrders.length) {
        throw new Error('Failed to insert Amazon orders or no rows returned');
      }

      const orderIdByExternal = new Map(
        insertedOrders.map((o) => [o.external_order_id, o.id]),
      );

      // ------------------------------
      // 6️⃣ Fetch order items per order & map to DB
      // ------------------------------
      const orderItemsInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      const shipmentsInserts: Database['public']['Tables']['fulfillments']['Insert'][] =
        [];

      for (const order of orders) {
        const orderId = orderIdByExternal.get(order.AmazonOrderId);
        if (!orderId) continue;

        // Fetch items from Amazon service
        const items = await this.amazonService.getOrderItems(
          order.AmazonOrderId,
        );

        for (const item of items) {
          const productId =
            productMap[item.ASIN] ??
            productMap[item.SellerSKU ?? ''] ??
            undefined;

          // Map order items
          orderItemsInserts.push(
            mapAmazonOrderItemToDB(item, orderId, productId),
          );

          // Map shipments (fulfillments)
          if (order.FulfillmentChannel) {
            shipmentsInserts.push(
              mapAmazonShipmentToDB(order, item, store.id, orderId, productId),
            );
          }
        }
      }

      // ------------------------------
      // 7️⃣ Insert order items
      // ------------------------------
      if (orderItemsInserts.length) {
        await this.orderItemsRepo.insertOrderItems(orderItemsInserts);
      }

      // ------------------------------
      // 8️⃣ Insert shipments
      // ------------------------------
      if (shipmentsInserts.length) {
        await this.shipmentRepo.insertShipments(shipmentsInserts);
      }

      this.logger.log(
        `Amazon sync complete: ${orders.length} orders, ${orderItemsInserts.length} items, ${shipmentsInserts.length} shipments`,
      );
    }
    if (platform === 'warehouse') {
      // ------------------------------
      // 1️⃣ Fetch Store
      // ------------------------------
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) throw new Error(`Store not found for ${platform}`);

      // ------------------------------
      // 2️⃣ Fetch Products → external_product_id → product.id
      // ------------------------------
      const products = await this.productsRepo.getAllProductsByStore(storeId);
      const productIdByExternalId = new Map(
        products.map((p) => [p.external_product_id, p.id]),
      );
      const productIdBySku = new Map(products.map((p) => [p.sku, p.id]));

      // ------------------------------
      // 3️⃣ Fetch Orders from Warehance
      // ------------------------------
      const ordersResponse = await this.warehanceService.getOrders();
      const orders = ordersResponse?.orders ?? [];
      if (!orders.length) return;

      // ------------------------------
      // 4️⃣ Map Orders
      // ------------------------------
      const orderInserts = mapWarehanceOrdersToDB(
        ordersResponse,
        storeId,
        platform,
      );

      // ------------------------------
      // 5️⃣ Insert Orders & capture internal IDs
      // ------------------------------
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(orderInserts);

      const orderIdByExternalId = new Map(
        insertedOrders.map((o) => [o.external_order_id, o.id]),
      );

      // ------------------------------
      // 6️⃣ Map Order Items
      // ------------------------------
      const orderItemInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];

      for (const order of orders) {
        const orderId = orderIdByExternalId.get(String(order.id));
        if (!orderId) continue;

        orderItemInserts.push(
          ...mapWarehanceOrderItemsToDB(order, orderId, productIdBySku),
        );
      }

      // ------------------------------
      // 7️⃣ Insert Order Items
      // ------------------------------
      await this.orderItemsRepo.insertOrderItems(orderItemInserts);

      // ------------------------------
      // 8️⃣ Fetch Shipments from Warehance
      // ------------------------------
      const shipmentsResponse = await this.warehanceService.getShipments();

      // ------------------------------
      // 9️⃣ Map Shipments
      // ------------------------------
      const fulfillmentInserts = mapWarehanceShipmentsToDB(
        shipmentsResponse,
        storeId,
        platform,
        orderIdByExternalId,
        productIdByExternalId,
      );

      // ------------------------------
      // 🔟 Insert Fulfillments
      // ------------------------------
      await this.shipmentRepo.insertShipments(fulfillmentInserts);

      this.logger.log(
        `Orders sync complete: ${orderInserts.length} orders, ${orderItemInserts.length} items, ${fulfillmentInserts.length} fulfillments`,
      );
    }
  }
}
