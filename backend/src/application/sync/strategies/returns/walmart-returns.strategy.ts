import { Inject, Injectable, Logger } from '@nestjs/common';
import { mapWalmartReturnsToDB } from '../../../../infrastructure/external/connectors/walmart/walmart.mapper';
import { WalmartService } from '../../../../infrastructure/external/connectors/walmart/walmart.service';
import { ReturnOrder } from '../../../../infrastructure/external/connectors/walmart/walmart.types';
import {
  ALERTS_REPOSITORY,
  AlertsRepositoryPort,
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
export class WalmartReturnsStrategy implements SyncStrategy<ReturnsSyncStrategyContext> {
  readonly platform = 'walmart' as const;
  readonly domain = 'returns' as const;
  private readonly logger = new Logger(WalmartReturnsStrategy.name);

  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepo: OrdersRepositoryPort,
    @Inject(RETURNS_REPOSITORY)
    private readonly returnsRepo: ReturnsRepositoryPort,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(ALERTS_REPOSITORY)
    private readonly alertsRepo: AlertsRepositoryPort,
  ) {}

  async sync({ service, store }: ReturnsSyncStrategyContext): Promise<void> {
    const walmartService = service as WalmartService;

    try {
      const since = store.last_returns_synced_at
        ? new Date(store.last_returns_synced_at).toISOString()
        : undefined;

      const walmartReturns: ReturnOrder[] | null =
        await walmartService.getWalmartProductReturns(since);
      if (!walmartReturns?.length) {
        this.logger.warn('No returns returned from Walmart');
        return;
      }

      const externalOrderIds = [
        ...new Set(
          walmartReturns
            .map(
              (walmartReturn) =>
                walmartReturn.customerOrderId ??
                walmartReturn.returnOrderLines?.[0]?.purchaseOrderId,
            )
            .filter(Boolean),
        ),
      ];

      if (!externalOrderIds.length) {
        this.logger.warn('No order IDs found in Walmart returns');
        return;
      }

      const orders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      if (!orders.length) {
        this.logger.warn(
          `No matching orders found for ${externalOrderIds.length} Walmart returns`,
        );
        return;
      }

      const orderIdMap = new Map<string, string>();
      orders.forEach((order) =>
        orderIdMap.set(order.external_order_id, order.id),
      );

      const rawReturns = mapWalmartReturnsToDB(walmartReturns, store.id);

      const returnsDB: Database['public']['Tables']['returns']['Insert'][] =
        rawReturns
          .filter((returnRow) => orderIdMap.has(returnRow.order_id))
          .map((returnRow) => ({
            ...returnRow,
            order_id: orderIdMap.get(returnRow.order_id)!,
          }));

      if (!returnsDB.length) {
        this.logger.warn('No returns matched existing orders');
        return;
      }

      const { error } = await this.returnsRepo.insertReturns(returnsDB);
      if (error) throw error;

      this.logger.log(
        `Successfully synced ${returnsDB.length} Walmart returns`,
      );
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} product returns failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Returns sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'returns_sync_failure',
        message: `${store.platform.toUpperCase()} product returns sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }
}
