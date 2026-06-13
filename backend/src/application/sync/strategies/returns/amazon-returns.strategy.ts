import { Inject, Injectable, Logger } from '@nestjs/common';
import { mapAmazonReturnToDB } from '../../../../infrastructure/external/connectors/amazon/amazon.mapper';
import { AmazonService } from '../../../../infrastructure/external/connectors/amazon/amazon.service';
import { AmazonReturnReportItem } from '../../../../infrastructure/external/connectors/amazon/amazon.types';
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
export class AmazonReturnsStrategy implements SyncStrategy<ReturnsSyncStrategyContext> {
  readonly platform = 'amazon' as const;
  readonly domain = 'returns' as const;
  private readonly logger = new Logger(AmazonReturnsStrategy.name);

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
    const amazonService = service as AmazonService;

    try {
      const since = store.last_returns_synced_at
        ? new Date(store.last_returns_synced_at).toISOString()
        : undefined;

      const reportReturns: AmazonReturnReportItem[] =
        await amazonService.getReturns(store, since);
      if (!reportReturns.length) return;

      const externalOrderIds = [
        ...new Set(reportReturns.map((reportReturn) => reportReturn.order_id)),
      ];

      const orders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      const orderIdByExternal = new Map(
        orders.map((order) => [order.external_order_id, order.id]),
      );

      const inserts: Database['public']['Tables']['returns']['Insert'][] = [];

      for (const reportReturn of reportReturns) {
        const orderId = orderIdByExternal.get(reportReturn.order_id);
        if (!orderId) continue;

        inserts.push(mapAmazonReturnToDB(reportReturn, store.id, orderId));
      }

      const { error } = await this.returnsRepo.insertReturns(inserts);
      if (error) throw error;

      this.logger.log(`Successfully synced ${inserts.length} Amazon returns`);
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
