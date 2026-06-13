import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformServiceFactory } from '../../../../application/connectors/platform-factory.service';
import { SyncOutcomeService } from '../../../../application/sync/outcomes/sync-outcome.service';
import { SyncStrategyRegistry } from '../../../../application/sync/sync-strategy.registry';
import { SyncJobPayload, StoreRow } from '../../../../application/sync/sync.types';
import { AmazonReturnsStrategy } from '../../../../application/sync/strategies/returns/amazon-returns.strategy';
import { ReturnsSyncStrategyContext } from '../../../../application/sync/strategies/returns/returns-sync-strategy.types';
import { ShopifyReturnsStrategy } from '../../../../application/sync/strategies/returns/shopify-returns.strategy';
import { TargetReturnsStrategy } from '../../../../application/sync/strategies/returns/target-returns.strategy';
import { TikTokReturnsStrategy } from '../../../../application/sync/strategies/returns/tiktok-returns.strategy';
import { WalmartReturnsStrategy } from '../../../../application/sync/strategies/returns/walmart-returns.strategy';
import {
  STORE_CREDENTIALS_REPOSITORY,
  StoreCredentialsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';

@Processor('returns', { concurrency: 5 })
export class ReturnsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReturnsProcessor.name);
  private returnStrategies: SyncStrategyRegistry<ReturnsSyncStrategyContext>;

  constructor(
    private readonly platformFactory: PlatformServiceFactory,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(STORE_CREDENTIALS_REPOSITORY)
    private readonly storeCredentialsService: StoreCredentialsRepositoryPort,
    private readonly syncOutcome: SyncOutcomeService,
    private readonly targetReturnsStrategy: TargetReturnsStrategy,
    private readonly walmartReturnsStrategy: WalmartReturnsStrategy,
    private readonly amazonReturnsStrategy: AmazonReturnsStrategy,
    private readonly shopifyReturnsStrategy: ShopifyReturnsStrategy,
    private readonly tiktokReturnsStrategy: TikTokReturnsStrategy,
  ) {
    super();

    this.returnStrategies = new SyncStrategyRegistry<ReturnsSyncStrategyContext>(
      'returns',
      [
        {
          platform: 'target',
          domain: 'returns',
          sync: (context) => this.targetReturnsStrategy.sync(context),
        },
        {
          platform: 'walmart',
          domain: 'returns',
          sync: (context) => this.walmartReturnsStrategy.sync(context),
        },
        {
          platform: 'amazon',
          domain: 'returns',
          sync: (context) => this.amazonReturnsStrategy.sync(context),
        },
        {
          platform: 'shopify',
          domain: 'returns',
          sync: (context) => this.shopifyReturnsStrategy.sync(context),
        },
        {
          platform: 'tiktok',
          domain: 'returns',
          sync: (context) => this.tiktokReturnsStrategy.sync(context),
        },
      ],
    );
  }

  async process(job: Job): Promise<void> {
    const payload = job.data as SyncJobPayload;
    const { storeId, platform } = payload;

    if (!storeId) {
      throw new Error('storeId is required');
    }

    if (!platform) {
      this.logger.warn(`Skipping job ${job.id}: missing/invalid platform`);
      return;
    }

    let store: StoreRow | null = null;

    try {
      store = (await this.storeRepo.getStoreById(storeId)) as StoreRow;
      const credentials =
        await this.storeCredentialsService.getCredentialsByStoreId(storeId);

      let service;
      try {
        service = await this.platformFactory.createService(
          platform,
          credentials,
          store,
        );
      } catch (serviceError) {
        this.logger.error(
          `Failed to create service for ${platform}`,
          serviceError,
        );
        throw serviceError;
      }

      try {
        await this.returnStrategies.sync(platform, { service, store });
      } catch (strategyError) {
        if (
          strategyError.message ===
          `No returns sync strategy registered for platform ${platform}`
        ) {
          this.logger.warn(
            `Returns sync not supported for platform: ${platform}`,
          );
          return;
        }

        throw strategyError;
      }

      await this.syncOutcome.markSuccess(store, 'returns');
    } catch (error) {
      this.logger.error(
        `Failed to process returns for store ${storeId}: ${error.message}`,
        error.stack,
      );

      await this.syncOutcome.markFailure(
        store,
        'returns',
        platform,
        error.message,
      );

      throw error;
    }
  }
}
