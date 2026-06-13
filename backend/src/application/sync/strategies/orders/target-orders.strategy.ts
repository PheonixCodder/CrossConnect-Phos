import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  mapFulfillmentToDB,
  mapOrderLinesToDB,
  mapOrderToDB,
  TargetFulfillment,
  TargetOrder,
} from '../../../../infrastructure/external/connectors/target/target.mapper';
import { TargetService } from '../../../../infrastructure/external/connectors/target/target.service';
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
export class TargetOrdersStrategy implements SyncStrategy<OrdersSyncStrategyContext> {
  readonly platform = 'target' as const;
  readonly domain = 'orders' as const;
  private readonly logger = new Logger(TargetOrdersStrategy.name);

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
    const targetService = service as TargetService;

    try {
      const since = store.last_orders_synced_at
        ? new Date(store.last_orders_synced_at).toISOString()
        : undefined;

      const orders: TargetOrder[] = await targetService.getAllOrders({ since });
      if (!orders?.length) {
        this.logger.warn('No orders fetched from Target');
        return;
      }

      const orderLineSkus = [
        ...new Set(
          orders
            .flatMap((order) => order.order_lines ?? [])
            .map((line) => line.external_id)
            .filter(Boolean),
        ),
      ];
      const productIdBySku =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          orderLineSkus,
          'target',
        );
      const productMap = Object.fromEntries(productIdBySku);

      const dbOrders = orders.map((o) => mapOrderToDB(o, store.id));

      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(dbOrders);
      if (!insertedOrders || !insertedOrders.length) {
        throw new Error('Failed to insert orders or no rows returned');
      }

      const externalToInternalOrderId = new Map<string, string>();
      insertedOrders.forEach(
        (row: Database['public']['Tables']['orders']['Row']) => {
          if (row.external_order_id && row.id) {
            externalToInternalOrderId.set(row.external_order_id, row.id);
          }
        },
      );

      const dbOrderItems: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      for (const order of orders) {
        const internalOrderId = externalToInternalOrderId.get(order.id);
        if (!internalOrderId) {
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

        let fulfills: TargetFulfillment[] = [];
        try {
          fulfills = await targetService.getOrderFulfillments(order.id);
        } catch (err) {
          this.logger.error(
            `Failed to fetch fulfillments for order ${order.id}`,
            err,
          );
          continue;
        }

        const lineNumberToSku = new Map<string, string>();
        (order.order_lines || []).forEach((line) =>
          lineNumberToSku.set(line.order_line_number, line.external_id),
        );

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

      if (dbOrderItems.length) {
        await this.orderItemsRepo.bulkUpsertOrderItems(dbOrderItems);
      } else {
        this.logger.log('No order items to insert for this run');
      }

      if (dbFulfillments.length) {
        await this.shipmentRepo.insertShipments(dbFulfillments);
      } else {
        this.logger.log('No fulfillments to insert for this run');
      }

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
}
