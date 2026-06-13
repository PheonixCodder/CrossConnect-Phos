import { Inject, Injectable, Logger } from '@nestjs/common';
import { mapTiktokReturnsToDB } from '../../../../infrastructure/external/connectors/tiktok/tiktok.mapper';
import { TikTokService } from '../../../../infrastructure/external/connectors/tiktok/tiktok.service';
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
import { SyncStrategy } from '../../sync-strategy.types';
import { ReturnsSyncStrategyContext } from './returns-sync-strategy.types';

@Injectable()
export class TikTokReturnsStrategy implements SyncStrategy<ReturnsSyncStrategyContext> {
  readonly platform = 'tiktok' as const;
  readonly domain = 'returns' as const;
  private readonly logger = new Logger(TikTokReturnsStrategy.name);

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
    const tiktokService = service as TikTokService;
    const since = store.last_returns_synced_at
      ? Math.floor(new Date(store.last_returns_synced_at).getTime() / 1000)
      : undefined;

    try {
      const tiktokReturns = await tiktokService.getAllReturns(store.id, since);

      if (!tiktokReturns?.length) {
        this.logger.log('No TikTok returns found');
        return;
      }

      const externalOrderIds = [
        ...new Set(
          tiktokReturns
            .map((tiktokReturn) => tiktokReturn.orderId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      if (!externalOrderIds.length) {
        this.logger.warn('TikTok returns missing order IDs');
        return;
      }

      const orders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      if (!orders.length) {
        this.logger.warn(
          `No orders found for ${externalOrderIds.length} TikTok returns`,
        );
        return;
      }

      const orderIdMap = new Map<string, string>();
      for (const order of orders) {
        orderIdMap.set(order.external_order_id, order.id);
      }

      const returnsToInsert = mapTiktokReturnsToDB(
        tiktokReturns,
        store.id,
        orderIdMap,
      );

      if (!returnsToInsert.length) {
        this.logger.warn('No TikTok returns passed FK validation');
        return;
      }

      const { error } = await this.returnsRepo.insertReturns(returnsToInsert);
      if (error) throw error;

      this.logger.log(
        `Synced ${returnsToInsert.length} TikTok returns for store ${store.id}`,
      );
    } catch (error) {
      this.logger.error(
        `TIKTOK returns sync failed for store ${store.id}`,
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
        message: `TikTok returns sync failed: ${error.message}`,
        severity: 'high',
        platform: 'tiktok',
      });

      throw error;
    }
  }
}
