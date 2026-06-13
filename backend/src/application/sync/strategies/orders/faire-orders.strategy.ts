import { Inject, Injectable, Logger } from '@nestjs/common';
import { mapOrdersToDB } from '../../../../infrastructure/external/connectors/faire/faire.mapper';
import { FaireService } from '../../../../infrastructure/external/connectors/faire/faire.service';
import { getOrders } from '../../../../infrastructure/external/connectors/faire/faire.types';
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
export class FaireOrdersStrategy implements SyncStrategy<OrdersSyncStrategyContext> {
  readonly platform = 'faire' as const;
  readonly domain = 'orders' as const;
  private readonly logger = new Logger(FaireOrdersStrategy.name);

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
    const faireService = service as FaireService;

    try {
      const products = await this.productsRepo.getAllProductsByStore(store.id);
      const productMap = new Map<string, string>();
      products.forEach((p) => {
        if (p.external_product_id) {
          productMap.set(p.external_product_id, p.id);
        }
      });

      const orders: getOrders['orders'] = await faireService.getAllOrders();
      if (!orders || orders.length === 0) {
        this.logger.warn('No orders fetched from Faire');
        return;
      }

      const { orders: rawOrders } = mapOrdersToDB(orders, store.id);

      if (rawOrders.length === 0) return;

      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(rawOrders);

      const orderIdMap = new Map<string, string>();
      insertedOrders?.forEach(
        (order: Database['public']['Tables']['orders']['Row']) =>
          orderIdMap.set(order.external_order_id, order.id),
      );

      const { orderItems: orderItemsDB, shipments: shipmentsDB } =
        mapOrdersToDB(orders, store.id, productMap, orderIdMap);

      await this.orderItemsRepo.bulkUpsertOrderItems(orderItemsDB);
      await this.shipmentRepo.insertShipments(shipmentsDB);

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
}
