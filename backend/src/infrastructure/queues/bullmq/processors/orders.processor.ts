import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformServiceFactory } from '../../../../application/connectors/platform-factory.service';
import { SyncOutcomeService } from '../../../../application/sync/outcomes/sync-outcome.service';
import { SyncStrategyRegistry } from '../../../../application/sync/sync-strategy.registry';
import { SyncJobPayload, StoreRow } from '../../../../application/sync/sync.types';
import { AmazonOrdersStrategy } from '../../../../application/sync/strategies/orders/amazon-orders.strategy';
import { FaireOrdersStrategy } from '../../../../application/sync/strategies/orders/faire-orders.strategy';
import { OrdersSyncStrategyContext } from '../../../../application/sync/strategies/orders/orders-sync-strategy.types';
import { ShopifyOrdersStrategy } from '../../../../application/sync/strategies/orders/shopify-orders.strategy';
import { TargetOrdersStrategy } from '../../../../application/sync/strategies/orders/target-orders.strategy';
import { TikTokOrdersStrategy } from '../../../../application/sync/strategies/orders/tiktok-orders.strategy';
import { WalmartOrdersStrategy } from '../../../../application/sync/strategies/orders/walmart-orders.strategy';
import { WarehanceOrdersStrategy } from '../../../../application/sync/strategies/orders/warehance-orders.strategy';
import {
  STORE_CREDENTIALS_REPOSITORY,
  StoreCredentialsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';

@Processor('orders', { concurrency: 5 })
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);
  private readonly orderStrategies: SyncStrategyRegistry<OrdersSyncStrategyContext>;

  constructor(
    private readonly platformFactory: PlatformServiceFactory,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(STORE_CREDENTIALS_REPOSITORY)
    private readonly storeCredentialsService: StoreCredentialsRepositoryPort,
    private readonly syncOutcome: SyncOutcomeService,
    private readonly faireOrdersStrategy: FaireOrdersStrategy,
    private readonly targetOrdersStrategy: TargetOrdersStrategy,
    private readonly walmartOrdersStrategy: WalmartOrdersStrategy,
    private readonly amazonOrdersStrategy: AmazonOrdersStrategy,
    private readonly warehanceOrdersStrategy: WarehanceOrdersStrategy,
    private readonly shopifyOrdersStrategy: ShopifyOrdersStrategy,
    private readonly tiktokOrdersStrategy: TikTokOrdersStrategy,
  ) {
    super();

    this.orderStrategies = new SyncStrategyRegistry<OrdersSyncStrategyContext>(
      'orders',
      [
        {
          platform: 'faire',
          domain: 'orders',
          sync: (context) => this.faireOrdersStrategy.sync(context),
        },
        {
          platform: 'target',
          domain: 'orders',
          sync: (context) => this.targetOrdersStrategy.sync(context),
        },
        {
          platform: 'walmart',
          domain: 'orders',
          sync: (context) => this.walmartOrdersStrategy.sync(context),
        },
        {
          platform: 'amazon',
          domain: 'orders',
          sync: (context) => this.amazonOrdersStrategy.sync(context),
        },
        {
          platform: 'shopify',
          domain: 'orders',
          sync: (context) => this.shopifyOrdersStrategy.sync(context),
        },
        {
          platform: 'warehance',
          domain: 'orders',
          sync: (context) => this.warehanceOrdersStrategy.sync(context),
        },
        {
          platform: 'tiktok',
          domain: 'orders',
          sync: (context) => this.tiktokOrdersStrategy.sync(context),
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

      await this.orderStrategies.sync(platform, { service, store });

      await this.syncOutcome.markSuccess(store, 'orders');
    } catch (error) {
      this.logger.error(`Orders job failed for store ${storeId}`, error.stack);
      await this.syncOutcome.markFailure(
        store,
        'orders',
        platform,
        error.message,
      );
      throw error;
    }
  }
}
