import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import {
  buildSyncJobId,
  buildSyncJobPayload,
  getSyncJobName,
  isReturnsSupported,
} from '../sync-job.util';
import { StoreRow, SyncDomain, SyncJobPayload } from '../sync.types';
import {
  ALERTS_REPOSITORY,
  AlertsRepositoryPort,
  STORE_CREDENTIALS_REPOSITORY,
  STORES_REPOSITORY,
  StoreCredentialsRepositoryPort,
  StoreRecord,
  StoresRepositoryPort,
} from '../../../domain/repositories/repository-ports';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectQueue('products') private readonly productsQueue: Queue,
    @InjectQueue('orders') private readonly ordersQueue: Queue,
    @InjectQueue('returns') private readonly returnsQueue: Queue,
    @Inject(STORES_REPOSITORY)
    private readonly storesRepository: StoresRepositoryPort,
    @Inject(STORE_CREDENTIALS_REPOSITORY)
    private readonly storeCredentialsService: StoreCredentialsRepositoryPort,
    @Inject(ALERTS_REPOSITORY)
    private readonly alertsRepository: AlertsRepositoryPort,
  ) {}
  async onModuleInit() {
    await this.cleanupOldJobs();
    this.logger.log('Application started, triggering immediate poll...');
    await this.pollAllActiveStores();
  }

  @Interval(25200000)
  async pollAllActiveStores() {
    this.logger.log('Starting scheduled poll of all active stores');

    try {
      const storesWithCredentials =
        await this.storeCredentialsService.getActiveStoresWithCredentials();

      if (storesWithCredentials.length === 0) {
        this.logger.warn('No active stores with credentials found');
        return;
      }

      this.logger.log(
        `Found ${storesWithCredentials.length} active stores to poll`,
      );

      const queuedStores: string[] = [];

      // Process stores sequentially with small delay to avoid overwhelming Redis/Supabase
      for (const { store, credentials } of storesWithCredentials) {
        try {
          if (!credentials || Object.keys(credentials).length === 0) {
            this.logger.warn(
              `No credentials for store ${store.id} (${store.platform})`,
            );
            continue;
          }

          await this.queueSyncJob(this.productsQueue, store, 'products');
          await this.queueSyncJob(this.ordersQueue, store, 'orders');
          await this.queueReturnsJob(store);

          queuedStores.push(store.id);

          this.logger.debug(
            `Queued sync jobs for store ${store.id} (${store.platform})`,
          );

          // Small delay to prevent rate limiting / Redis overload
          await new Promise((r) => setTimeout(r, 500));
        } catch (storeError) {
          this.logger.error(
            `Failed to queue jobs for store ${store.id}`,
            storeError.stack,
          );

          await this.storesRepository.updateStoreHealth(
            store.id,
            'unhealthy',
            `Failed to queue sync jobs: ${storeError.message}`,
          );

          await this.alertsRepository.createAlert({
            store_id: store.id,
            alert_type: 'sync_queue_failure',
            message: `Failed to queue jobs for ${store.platform}: ${storeError.message}`,
            severity: 'high',
            platform: store.platform,
          });
        }
      }

      if (queuedStores.length > 0) {
        await this.markStoresAsQueued(queuedStores);
      }

      this.logger.log(
        `Successfully queued jobs for ${queuedStores.length} stores`,
      );
    } catch (error) {
      this.logger.error('Poll all active stores failed', error);
      await this.alertsRepository.createAlert({
        store_id: null,
        alert_type: 'global_poll_failure',
        message: `Poll all active stores failed: ${error.message}`,
        severity: 'critical',
      });
    }
  }

  private async queueReturnsJob(
    store: StoreRecord,
  ) {
    if (isReturnsSupported(store.platform)) {
      await this.queueSyncJob(this.returnsQueue, store, 'returns');
    }
  }

  private async queueSyncJob(
    queue: Queue,
    store: StoreRecord,
    domain: SyncDomain,
  ) {
    const payload: SyncJobPayload = buildSyncJobPayload(store as StoreRow, domain);

    await queue.add(getSyncJobName(payload), payload, {
      jobId: buildSyncJobId(domain, store.id, payload.since),
      removeOnComplete: true,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnFail: false,
    });
  }

  private async markStoresAsQueued(storeIds: string[]) {
    try {
      const { error } = await this.storesRepository.storesAsQueued(storeIds);
      // Bulk update last_health_check + status
      if (error) throw error;

      this.logger.debug(`Marked ${storeIds.length} stores as queued`);
    } catch (error) {
      this.logger.error('Failed to mark stores as queued', error);
      await this.alertsRepository.createAlert({
        store_id: null,
        alert_type: 'health_check_failure',
        message: `Failed to mark queued stores: ${error.message}`,
        severity: 'high',
      });
    }
  }

  @Interval(300000) // 5 minutes – lighter health check
  async healthCheck() {
    try {
      const activeStores = await this.storesRepository.getAllActiveStores();
      this.logger.debug(`Health check: ${activeStores.length} active stores`);

      // Optional: check Redis/Supabase connectivity here
    } catch (error) {
      this.logger.error('Health check failed', error);
      await this.alertsRepository.createAlert({
        store_id: null,
        alert_type: 'health_check_failure',
        message: `Health check failed: ${error.message}`,
        severity: 'critical',
      });
    }
  }

  @Interval(86400000) // daily
  async cleanupOldJobs() {
    try {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

      await Promise.all([
        this.productsQueue.clean(cutoff, 1000, 'completed'),
        this.ordersQueue.clean(cutoff, 1000, 'completed'),
        this.returnsQueue.clean(cutoff, 1000, 'completed'),
      ]);

      this.logger.log('Cleaned old completed jobs');
    } catch (error) {
      this.logger.error('Cleanup old jobs failed', error);
      await this.alertsRepository.createAlert({
        store_id: null,
        alert_type: 'cleanup_failure',
        message: `Cleanup old jobs failed: ${error.message}`,
        severity: 'medium',
      });
    }
  }
}
