import { Inject, Injectable, Logger } from '@nestjs/common';
import { TikTokService } from '../../../../infrastructure/external/connectors/tiktok/tiktok.service';
import {
  mapTiktokFulfillmentsToDB,
  mapTiktokOrderToDB,
  mapTikTokPerformanceToDb,
} from '../../../../infrastructure/external/connectors/tiktok/tiktok.mapper';
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
export class TikTokOrdersStrategy implements SyncStrategy<OrdersSyncStrategyContext> {
  readonly platform = 'tiktok' as const;
  readonly domain = 'orders' as const;
  private readonly logger = new Logger(TikTokOrdersStrategy.name);

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
    const tiktokService = service as TikTokService;
    const since = store.last_orders_synced_at
      ? Math.floor(new Date(store.last_orders_synced_at).getTime() / 1000)
      : undefined;

    try {
      const orders = await tiktokService.getAllOrders(store.id, since);

      if (!orders?.length) {
        this.logger.log(`[TikTok] No orders to sync for store ${store.id}`);
        return;
      }

      const orderLineSkus = [
        ...new Set(
          orders
            .flatMap((order) => order.lineItems ?? [])
            .flatMap((lineItem) => [
              lineItem.sellerSku as string,
              lineItem.skuId as string,
              lineItem.combinedListingSkus?.[0]?.sellerSku as string,
            ])
            .filter(Boolean),
        ),
      ];
      const productIdBySku =
        await this.productsRepo.getProductIdsBySkusInBatches(
          store.id,
          orderLineSkus,
          'tiktok',
        );

      const orderInserts = orders.map((order) =>
        mapTiktokOrderToDB(order, store.id),
      );

      const { data: persistedOrders } =
        await this.ordersRepo.insertOrdersAndReturn(orderInserts);

      if (!persistedOrders?.length) {
        throw new Error('Orders upsert returned no rows');
      }

      const orderIdByExternalId = new Map<string, string>(
        persistedOrders.map((order) => [order.external_order_id, order.id!]),
      );

      const orderItemInserts: Database['public']['Tables']['order_items']['Insert'][] =
        [];
      const lineItemProductMap = new Map<string, string | null>();

      for (const order of orders) {
        const orderId = orderIdByExternalId.get(order.id!);
        if (!orderId) continue;

        for (const lineItem of order.lineItems ?? []) {
          const sku: string =
            (lineItem.sellerSku as string) ??
            (lineItem.skuId as string) ??
            (lineItem.combinedListingSkus?.[0]?.sellerSku as string);

          const productId = sku ? (productIdBySku.get(sku) ?? null) : null;

          if (lineItem.id) {
            lineItemProductMap.set(lineItem.id, productId);
          }

          const price = Number(
            lineItem.salePrice ?? lineItem.originalPrice ?? '0',
          );

          orderItemInserts.push({
            order_id: orderId,
            external_line_item_id: lineItem.id ?? null,
            sku,
            product_id: productId,
            quantity: 1,
            price,
            total: price,
            fulfilled_quantity: 0,
            refunded_quantity: 0,
          });
        }
      }

      if (orderItemInserts.length) {
        await this.orderItemsRepo.bulkUpsertOrderItems(orderItemInserts);
      }

      const packages = await tiktokService.getAllFulfillments(store.id, since);

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

      const analytics = await tiktokService.getDailyGMV(store.id);

      if (analytics?.length) {
        const analyticsInserts = mapTikTokPerformanceToDb(analytics, store.id);

        if (analyticsInserts.length) {
          await this.metricsRepo.bulkUpsertMetrics(analyticsInserts);
        }
      }

      this.logger.log(
        `[TikTok] Orders sync complete - ${persistedOrders.length} orders`,
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
