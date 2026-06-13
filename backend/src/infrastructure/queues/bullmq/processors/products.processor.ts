import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformServiceFactory } from '../../../../application/connectors/platform-factory.service';
import { SyncOutcomeService } from '../../../../application/sync/outcomes/sync-outcome.service';
import { SyncStrategyRegistry } from '../../../../application/sync/sync-strategy.registry';
import { SyncJobPayload, StoreRow } from '../../../../application/sync/sync.types';
import { AmazonProductsStrategy } from '../../../../application/sync/strategies/products/amazon-products.strategy';
import { FaireProductsStrategy } from '../../../../application/sync/strategies/products/faire-products.strategy';
import { ProductsSyncStrategyContext } from '../../../../application/sync/strategies/products/products-sync-strategy.types';
import { ShopifyProductsStrategy } from '../../../../application/sync/strategies/products/shopify-products.strategy';
import { TargetProductsStrategy } from '../../../../application/sync/strategies/products/target-products.strategy';
import { TikTokProductsStrategy } from '../../../../application/sync/strategies/products/tiktok-products.strategy';
import { WalmartProductsStrategy } from '../../../../application/sync/strategies/products/walmart-products.strategy';
import { WarehanceProductsStrategy } from '../../../../application/sync/strategies/products/warehance-products.strategy';
import {
  STORE_CREDENTIALS_REPOSITORY,
  StoreCredentialsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../../domain/repositories/repository-ports';

@Processor('products', { concurrency: 5 })
export class ProductsProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductsProcessor.name);
  private readonly productStrategies: SyncStrategyRegistry<ProductsSyncStrategyContext>;

  constructor(
    private readonly platformFactory: PlatformServiceFactory,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(STORE_CREDENTIALS_REPOSITORY)
    private readonly storeCredentialsService: StoreCredentialsRepositoryPort,
    private readonly syncOutcome: SyncOutcomeService,
    private readonly shopifyProductsStrategy: ShopifyProductsStrategy,
    private readonly faireProductsStrategy: FaireProductsStrategy,
    private readonly targetProductsStrategy: TargetProductsStrategy,
    private readonly walmartProductsStrategy: WalmartProductsStrategy,
    private readonly amazonProductsStrategy: AmazonProductsStrategy,
    private readonly warehanceProductsStrategy: WarehanceProductsStrategy,
    private readonly tiktokProductsStrategy: TikTokProductsStrategy,
  ) {
    super();

    this.productStrategies =
      new SyncStrategyRegistry<ProductsSyncStrategyContext>('products', [
        {
          platform: 'faire',
          domain: 'products',
          sync: (context) => this.faireProductsStrategy.sync(context),
        },
        {
          platform: 'target',
          domain: 'products',
          sync: (context) => this.targetProductsStrategy.sync(context),
        },
        {
          platform: 'walmart',
          domain: 'products',
          sync: (context) => this.walmartProductsStrategy.sync(context),
        },
        {
          platform: 'amazon',
          domain: 'products',
          sync: (context) => this.amazonProductsStrategy.sync(context),
        },
        {
          platform: 'warehance',
          domain: 'products',
          sync: (context) => this.warehanceProductsStrategy.sync(context),
        },
        {
          platform: 'shopify',
          domain: 'products',
          sync: (context) => this.shopifyProductsStrategy.sync(context),
        },
        {
          platform: 'tiktok',
          domain: 'products',
          sync: (context) => this.tiktokProductsStrategy.sync(context),
        },
      ]);
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

      await this.productStrategies.sync(platform, { service, store });

      await this.syncOutcome.markSuccess(store, 'products');
    } catch (error) {
      this.logger.error(
        `Failed to process products for store ${storeId}: ${error.message}`,
        error.stack,
      );

      await this.syncOutcome.markFailure(
        store,
        'products',
        platform,
        error.message,
      );

      throw error;
    }
  }
}
