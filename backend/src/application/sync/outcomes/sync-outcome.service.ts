import { Inject, Injectable } from '@nestjs/common';
import { SyncDomain, StoreRow } from '../sync.types';
import {
  ALERTS_REPOSITORY,
  AlertsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../domain/repositories/repository-ports';

const alertTypeByDomain: Record<SyncDomain, string> = {
  products: 'products_sync_failure',
  orders: 'order_sync_failure',
  returns: 'returns_sync_failure',
};

@Injectable()
export class SyncOutcomeService {
  constructor(
    @Inject(STORES_REPOSITORY)
    private readonly storesRepository: StoresRepositoryPort,
    @Inject(ALERTS_REPOSITORY)
    private readonly alertsRepository: AlertsRepositoryPort,
  ) {}

  async markSuccess(store: StoreRow, domain: SyncDomain): Promise<void> {
    const now = new Date().toISOString();

    await this.storesRepository.updateStoreHealth(store.id, 'healthy');
    await this.storesRepository.updateSyncTimestamps(store.id, domain, now);
  }

  async markFailure(
    store: StoreRow | null,
    domain: SyncDomain,
    platform: StoreRow['platform'],
    message: string,
  ): Promise<void> {
    const storeId = store?.id ?? null;

    if (storeId) {
      await this.storesRepository.updateStoreHealth(
        storeId,
        'unhealthy',
        `${this.labelDomain(domain)} sync failed: ${message}`,
      );
    }

    await this.alertsRepository.createAlert({
      store_id: storeId,
      alert_type: alertTypeByDomain[domain],
      message: `${platform.toUpperCase()} ${domain} sync failed: ${message}`,
      severity: 'high',
      platform,
    });
  }

  private labelDomain(domain: SyncDomain): string {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }
}
