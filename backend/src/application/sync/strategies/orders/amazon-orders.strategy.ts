import { Inject, Injectable, Logger } from '@nestjs/common';
import { chunk } from 'lodash';
import {
  mapAmazonOrderItemToDB,
  mapAmazonOrderToDB,
  mapAmazonShipmentToDB,
  mapFlatFileRowsToOrders,
  mapFlatFileRowToOrderItem,
  mapKioskToDB,
} from '../../../../infrastructure/external/connectors/amazon/amazon.mapper';
import { AmazonService } from '../../../../infrastructure/external/connectors/amazon/amazon.service';
import {
  METRICS_REPOSITORY,
  MetricsRepositoryPort,
  ORDERS_REPOSITORY,
  OrdersRepositoryPort,
  PRODUCTS_REPOSITORY,
  ProductsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';
import { SyncStrategy } from '../../sync-strategy.types';
import { OrdersSyncStrategyContext } from './orders-sync-strategy.types';

@Injectable()
export class AmazonOrdersStrategy implements SyncStrategy<OrdersSyncStrategyContext> {
  readonly platform = 'amazon' as const;
  readonly domain = 'orders' as const;
  private readonly logger = new Logger(AmazonOrdersStrategy.name);

  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepo: OrdersRepositoryPort,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepo: ProductsRepositoryPort,
    @Inject(METRICS_REPOSITORY)
    private readonly metricsRepo: MetricsRepositoryPort,
  ) {}

  async sync({ service, store }: OrdersSyncStrategyContext): Promise<void> {
    const amazonService = service as AmazonService;

    try {
      const isFirstSync = !store.last_orders_synced_at;

      let ordersPayload: any[] = [];
      const itemsPayload: any[] = [];
      const shipmentsPayload: any[] = [];

      if (isFirstSync) {
        const rows = await amazonService.getOrdersFlatFileReport(store);

        ordersPayload = mapFlatFileRowsToOrders(rows, store.id);
        const productMap = await this.productsRepo.getProductIdsByIdentifiers(
          store.id,
          'amazon',
          {
            asins: rows.map((row) => row['asin']).filter(Boolean),
            skus: rows.map((row) => row['sku']).filter(Boolean),
          },
        );

        for (const row of rows) {
          const productId =
            productMap.get(row['asin']) || productMap.get(row['sku']) || null;

          itemsPayload.push({
            ...mapFlatFileRowToOrderItem(
              row,
              row['amazon-order-id'],
              productId,
            ),
            external_order_id: row['amazon-order-id'],
          });
        }
      } else {
        const since = new Date(store.last_orders_synced_at!).toISOString();

        const orders = await amazonService.getOrders(store, since);

        if (!orders.length) {
          this.logger.log('No Amazon orders returned');
          return;
        }

        const orderWithItems = await Promise.all(
          orders.map(async (order) => {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            const items = await amazonService.getOrderItems(
              order.AmazonOrderId,
            );
            return { order, items };
          }),
        );

        const allItems = orderWithItems.flatMap(({ items }) => items);
        const productMap = await this.productsRepo.getProductIdsByIdentifiers(
          store.id,
          'amazon',
          {
            asins: allItems.map((item) => item.ASIN).filter(Boolean),
            skus: allItems.map((item) => item.SellerSKU!).filter(Boolean),
          },
        );

        for (const { order, items } of orderWithItems) {
          const dbOrder = mapAmazonOrderToDB(
            order,
            store.id,
            store.platform,
            items,
          );

          ordersPayload.push(dbOrder);

          for (const item of items) {
            const productId =
              productMap.get(item.ASIN) ||
              productMap.get(item.SellerSKU!) ||
              null;

            itemsPayload.push({
              ...mapAmazonOrderItemToDB(item, order.AmazonOrderId, productId),
              external_order_id: order.AmazonOrderId,
            });

            const fulfillment = mapAmazonShipmentToDB(
              order,
              item,
              store.id,
              order.AmazonOrderId,
              productId ?? undefined,
            );

            if (fulfillment) {
              shipmentsPayload.push({
                ...fulfillment,
                external_order_id: order.AmazonOrderId,
                store_id: store.id,
                platform: store.platform,
              });
            }
          }
        }

        this.logger.log(
          `Amazon orders fetched: ${ordersPayload.length} orders`,
        );
      }

      const orderChunks = chunk(ordersPayload, 500);

      for (const orderChunk of orderChunks) {
        const orderIds = new Set(orderChunk.map((o) => o.external_order_id));

        const filteredItems = itemsPayload.filter((i) =>
          orderIds.has(i.external_order_id),
        );

        const filteredShipments = shipmentsPayload.filter((s) =>
          orderIds.has(s.external_order_id),
        );

        await this.ordersRepo.syncOrderData(
          orderChunk,
          filteredItems,
          filteredShipments,
        );
      }

      const dailyData = await amazonService.getDailySalesDataKiosk(store);

      if (dailyData?.length) {
        const allMetrics = mapKioskToDB(dailyData, store.id);
        if (allMetrics.length) {
          await this.metricsRepo.bulkUpsertMetrics(allMetrics);
        }
      }

      await this.storeRepo.updateSyncTimestamps(
        store.id,
        'orders',
        new Date().toISOString(),
      );

      this.logger.log(
        `Amazon orders sync completed: ${ordersPayload.length} orders`,
      );
    } catch (error: any) {
      this.logger.error(
        `AMAZON orders failed for store ${store.id}`,
        error.stack,
      );
      throw error;
    }
  }
}
