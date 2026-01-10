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
  }
}
