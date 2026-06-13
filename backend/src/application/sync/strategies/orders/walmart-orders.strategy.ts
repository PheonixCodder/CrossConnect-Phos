import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  mapWalmartFulfillmentsToDB,
  mapWalmartOrderItemsToDB,
  mapWalmartOrderToDB,
} from '../../../../infrastructure/external/connectors/walmart/walmart.mapper';
import { WalmartService } from '../../../../infrastructure/external/connectors/walmart/walmart.service';
import { Order } from '../../../../infrastructure/external/connectors/walmart/walmart.types';
import { deriveMetricsFromOrders } from '../../../../domain/metrics/order-metrics.mapper';
import {
  ALERTS_REPOSITORY,
  AlertsRepositoryPort,
  FULFILLMENTS_REPOSITORY,
  FulfillmentsRepositoryPort,
  METRICS_REPOSITORY,
  MetricsRepositoryPort,
  ORDER_ITEMS_REPOSITORY,
  OrderItemsRepositoryPort,
  ORDERS_REPOSITORY,
  OrdersRepositoryPort,
  PRODUCTS_REPOSITORY,
  ProductsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';
import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
import { SyncStrategy } from '../../sync-strategy.types';
import { OrdersSyncStrategyContext } from './orders-sync-strategy.types';

@Injectable()
export class WalmartOrdersStrategy implements SyncStrategy<OrdersSyncStrategyContext> {
  readonly platform = 'walmart' as const;
  readonly domain = 'orders' as const;
  private readonly logger = new Logger(WalmartOrdersStrategy.name);

  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepo: OrdersRepositoryPort,
    @Inject(ORDER_ITEMS_REPOSITORY)
    private readonly orderItemsRepo: OrderItemsRepositoryPort,
    @Inject(FULFILLMENTS_REPOSITORY)
    private readonly shipmentRepo: FulfillmentsRepositoryPort,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepo: ProductsRepositoryPort,
    @Inject(METRICS_REPOSITORY)
    private readonly metricsRepo: MetricsRepositoryPort,
    @Inject(ALERTS_REPOSITORY)
    private readonly alertsRepo: AlertsRepositoryPort,
  ) {}

  async sync({ service, store }: OrdersSyncStrategyContext): Promise<void> {
    const walmartService = service as WalmartService;

    try {
      const since = store.last_orders_synced_at
        ? new Date(store.last_orders_synced_at).toISOString()
        : undefined;

      const response = await walmartService.getOrders(since);
      const orders: Order[] = response ?? [];
      if (!orders.length) return;

      const orderLineSkus = [
        ...new Set(
          orders
            .flatMap((order) => order.orderLines.orderLine ?? [])
            .map((line) => line.item?.sku)
            .filter(Boolean),
        ),
      ];
      const productMap = await this.productsRepo.getProductIdsBySkusInBatches(
        store.id,
        orderLineSkus,
        'walmart',
      );

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

      if (orderItems.length) {
        await this.orderItemsRepo.bulkUpsertOrderItems(orderItems);
      }

      if (fulfillments.length) {
        await this.shipmentRepo.insertShipments(fulfillments);
      }

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
}
