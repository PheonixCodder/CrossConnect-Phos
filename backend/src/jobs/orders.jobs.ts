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

@Processor('orders', { concurrency: 5 })
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly faireService: FaireService,
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
    if (platform !== 'FAIRE') return;

    // 1️⃣ Fetch store
    const storeId = await this.storeRepo.getStoreId(platform);
    if (!storeId) throw new Error(`Store not found for platform: ${platform}`);

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
      rawShipments.map((shipment) => ({
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
}
