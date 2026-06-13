import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  mapWarehanceOrderItemsToDB,
  mapWarehanceOrdersToDB,
  mapWarehanceShipmentsToDB,
} from '../../../../infrastructure/external/connectors/warehance/warehance.mapper';
import { WarehanceService } from '../../../../infrastructure/external/connectors/warehance/warehance.service';
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
import {
  ListOrdersResponse200,
  ListShipmentsResponse200,
} from '../../../../../.api/apis/warehance-api';
import { SyncStrategy } from '../../sync-strategy.types';
import { OrdersSyncStrategyContext } from './orders-sync-strategy.types';

@Injectable()
export class WarehanceOrdersStrategy implements SyncStrategy<OrdersSyncStrategyContext> {
  readonly platform = 'warehance' as const;
  readonly domain = 'orders' as const;
  private readonly logger = new Logger(WarehanceOrdersStrategy.name);

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
    const warehanceService = service as WarehanceService;
    const syncStart = new Date();
    const since = store.last_orders_synced_at
      ? new Date(store.last_orders_synced_at).toISOString()
      : undefined;

    try {
      this.logger.log(
        `Starting Warehance orders sync for store ${store.id} (incremental: ${!!since})`,
      );

      const ordersResponse: ListOrdersResponse200['data'] =
        await warehanceService.getOrders(since);
      const orders = ordersResponse?.orders ?? [];

      if (!orders.length) {
        this.logger.log('No orders found');
        return;
      }

      const orderInserts = mapWarehanceOrdersToDB(
        ordersResponse,
        store.id,
        store.platform,
      );

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

      const shipmentsResponse: ListShipmentsResponse200['data'] =
        await warehanceService.getShipments(since);
      const productIds = await this.productsRepo.getProductIdsByIdentifiers(
        store.id,
        'warehance',
        {
          skus: orders
            .flatMap((order) => order.order_items ?? [])
            .map((item) => item.sku)
            .filter((sku): sku is string => Boolean(sku)),
          externalProductIds: (shipmentsResponse?.shipments ?? [])
            .flatMap((shipment) => shipment.shipment_parcels ?? [])
            .flatMap((parcel) => parcel.items ?? [])
            .map((item) => String(item.product?.id ?? ''))
            .filter(Boolean),
        },
      );

      const orderItemInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      const seen = new Set<string>();

      for (const order of orders) {
        const internalOrderId = orderIdByExternalId.get(String(order.id));
        if (!internalOrderId) continue;

        const newItems = mapWarehanceOrderItemsToDB(
          order,
          internalOrderId,
          productIds,
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

      await this.orderItemsRepo.bulkUpsertOrderItems(orderItemInserts);

      const fulfillmentInserts = mapWarehanceShipmentsToDB(
        shipmentsResponse,
        store.id,
        store.platform,
        orderIdByExternalId,
        productIds,
      );

      await this.shipmentRepo.insertShipments(fulfillmentInserts);

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
}
