import { Inject, Injectable, Logger } from '@nestjs/common';
import { mapShopifyReturnToDB } from '../../../../infrastructure/external/connectors/shopify/shopify.mapper';
import { ShopifyService } from '../../../../infrastructure/external/connectors/shopify/shopify.service';
import {
  ORDERS_REPOSITORY,
  OrdersRepositoryPort,
  RETURNS_REPOSITORY,
  ReturnsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';
import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
import { SyncStrategy } from '../../sync-strategy.types';
import { ReturnsSyncStrategyContext } from './returns-sync-strategy.types';

@Injectable()
export class ShopifyReturnsStrategy implements SyncStrategy<ReturnsSyncStrategyContext> {
  readonly platform = 'shopify' as const;
  readonly domain = 'returns' as const;
  private readonly logger = new Logger(ShopifyReturnsStrategy.name);

  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepo: OrdersRepositoryPort,
    @Inject(RETURNS_REPOSITORY)
    private readonly returnsRepo: ReturnsRepositoryPort,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
  ) {}

  async sync({ service, store }: ReturnsSyncStrategyContext): Promise<void> {
    const shopifyService = service as ShopifyService;

    try {
      const since = store.last_returns_synced_at
        ? new Date(store.last_returns_synced_at).toISOString()
        : undefined;

      const ordersWithReturns = await shopifyService.fetchReturns(since);

      if (!ordersWithReturns.length) {
        this.logger.log('No returns found.');
        return;
      }

      const externalOrderIds = ordersWithReturns.map(
        (orderEdge) => orderEdge.node.id,
      );

      const dbOrders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      const orderIdMap = new Map(
        dbOrders.map((order) => [order.external_order_id, order.id]),
      );

      const returnInserts: Database['public']['Tables']['returns']['Insert'][] =
        [];

      for (const orderEdge of ordersWithReturns) {
        const orderNode = orderEdge.node;
        const internalOrderId = orderIdMap.get(orderNode.id);

        if (!internalOrderId) {
          this.logger.warn(
            `Return skipped - order not found in DB: ${orderNode.id}`,
          );
          continue;
        }

        for (const returnNode of orderNode.returns?.nodes || []) {
          returnInserts.push(
            mapShopifyReturnToDB(
              orderNode,
              returnNode,
              store.id,
              internalOrderId,
            ),
          );
        }
      }

      const deduped = Array.from(
        new Map(
          returnInserts.map((returnRow) => [
            `${returnRow.store_id}-${returnRow.external_return_id}`,
            returnRow,
          ]),
        ).values(),
      );

      if (deduped.length > 0) {
        const { error } = await this.returnsRepo.insertReturns(deduped);

        if (error) throw error;

        this.logger.log(`Synced ${deduped.length} returns.`);

        await this.storeRepo.updateSyncTimestamps(
          store.id,
          'returns',
          new Date().toISOString(),
        );
      }
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} returns failed for store ${store.id}`,
        error.stack,
      );
      throw error;
    }
  }
}
