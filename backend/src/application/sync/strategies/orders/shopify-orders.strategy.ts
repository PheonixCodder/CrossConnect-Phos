import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  mapShopifyFulfillmentsToDB,
  mapShopifyOrderItemsToDB,
  mapShopifyOrderToDB,
  mapShopifyPerformanceToDb,
  ShopifyFulfillmentOrderNode,
  ShopifyOrderNode,
} from '../../../../infrastructure/external/connectors/shopify/shopify.mapper';
import { ShopifyService } from '../../../../infrastructure/external/connectors/shopify/shopify.service';
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
export class ShopifyOrdersStrategy implements SyncStrategy<OrdersSyncStrategyContext> {
  readonly platform = 'shopify' as const;
  readonly domain = 'orders' as const;
  private readonly logger = new Logger(ShopifyOrdersStrategy.name);

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
    const shopifyService = service as ShopifyService;

    try {
      const since = store.last_orders_synced_at
        ? new Date(store.last_orders_synced_at).toISOString()
        : undefined;

      const shopifyOrders: ShopifyOrderNode[] =
        await shopifyService.fetchOrders(since);
      if (!shopifyOrders.length) return;

      const orderInserts = shopifyOrders.map((order) =>
        mapShopifyOrderToDB(order, store.id),
      );
      const { data: insertedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(orderInserts);

      if (!insertedOrders) throw new Error('Failed to persist orders');

      const orderIdByExternalId = new Map(
        insertedOrders.map((order) => [order.external_order_id, order.id!]),
      );

      const fulfillmentNodes: ShopifyFulfillmentOrderNode[] =
        await shopifyService.fetchFulfillments();
      const productSkus = new Set<string>();
      for (const orderNode of shopifyOrders) {
        for (const lineItem of orderNode.lineItems.nodes) {
          if (lineItem.sku) productSkus.add(lineItem.sku);
        }
      }
      for (const orderNode of fulfillmentNodes) {
        for (const fulfillment of orderNode.fulfillments || []) {
          for (const fLine of fulfillment.fulfillmentLineItems?.nodes || []) {
            const rawSku = fLine.lineItem?.sku;
            const productGid = fLine.lineItem?.product?.id;
            const productNumericId = productGid?.split('/').pop();
            if (rawSku && productNumericId) {
              productSkus.add(`shopify-${productNumericId}-${rawSku}`);
            }
          }
        }
      }
      const productIdBySku =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          [...productSkus],
          'shopify',
        );

      const orderItemInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      for (const orderNode of shopifyOrders) {
        const internalId = orderIdByExternalId.get(orderNode.id);
        if (!internalId) continue;

        orderItemInserts.push(
          ...mapShopifyOrderItemsToDB(
            orderNode.lineItems.nodes,
            internalId,
            productIdBySku,
          ),
        );
      }

      if (orderItemInserts.length > 0) {
        await this.orderItemsRepo.bulkUpsertOrderItems(orderItemInserts);
      }

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

      const metrics = await shopifyService.fetchDailyMetrics();
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
}
