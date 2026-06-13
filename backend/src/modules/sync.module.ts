import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TasksService } from '../application/sync/scheduling/sync-scheduler.service';
import { SyncOutcomeService } from '../application/sync/outcomes/sync-outcome.service';
import { AmazonOrdersStrategy } from '../application/sync/strategies/orders/amazon-orders.strategy';
import { FaireOrdersStrategy } from '../application/sync/strategies/orders/faire-orders.strategy';
import { ShopifyOrdersStrategy } from '../application/sync/strategies/orders/shopify-orders.strategy';
import { TargetOrdersStrategy } from '../application/sync/strategies/orders/target-orders.strategy';
import { TikTokOrdersStrategy } from '../application/sync/strategies/orders/tiktok-orders.strategy';
import { WalmartOrdersStrategy } from '../application/sync/strategies/orders/walmart-orders.strategy';
import { WarehanceOrdersStrategy } from '../application/sync/strategies/orders/warehance-orders.strategy';
import { AmazonProductsStrategy } from '../application/sync/strategies/products/amazon-products.strategy';
import { FaireProductsStrategy } from '../application/sync/strategies/products/faire-products.strategy';
import { ShopifyProductsStrategy } from '../application/sync/strategies/products/shopify-products.strategy';
import { TargetProductsStrategy } from '../application/sync/strategies/products/target-products.strategy';
import { TikTokProductsStrategy } from '../application/sync/strategies/products/tiktok-products.strategy';
import { WalmartProductsStrategy } from '../application/sync/strategies/products/walmart-products.strategy';
import { WarehanceProductsStrategy } from '../application/sync/strategies/products/warehance-products.strategy';
import { AmazonReturnsStrategy } from '../application/sync/strategies/returns/amazon-returns.strategy';
import { ShopifyReturnsStrategy } from '../application/sync/strategies/returns/shopify-returns.strategy';
import { TargetReturnsStrategy } from '../application/sync/strategies/returns/target-returns.strategy';
import { TikTokReturnsStrategy } from '../application/sync/strategies/returns/tiktok-returns.strategy';
import { WalmartReturnsStrategy } from '../application/sync/strategies/returns/walmart-returns.strategy';
import { OrdersProcessor } from '../infrastructure/queues/bullmq/processors/orders.processor';
import { ProductsProcessor } from '../infrastructure/queues/bullmq/processors/products.processor';
import { ReturnsProcessor } from '../infrastructure/queues/bullmq/processors/returns.processor';
import { ConnectorsModule } from './connectors.module';
import { PersistenceModule } from './persistence.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'products',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'orders',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'returns',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    ConnectorsModule,
    PersistenceModule,
  ],
  providers: [
    ProductsProcessor,
    OrdersProcessor,
    ReturnsProcessor,
    SyncOutcomeService,
    TasksService,
    ShopifyProductsStrategy,
    FaireProductsStrategy,
    TargetProductsStrategy,
    WalmartProductsStrategy,
    AmazonProductsStrategy,
    WarehanceProductsStrategy,
    TikTokProductsStrategy,
    FaireOrdersStrategy,
    TargetOrdersStrategy,
    WalmartOrdersStrategy,
    AmazonOrdersStrategy,
    WarehanceOrdersStrategy,
    ShopifyOrdersStrategy,
    TikTokOrdersStrategy,
    TargetReturnsStrategy,
    WalmartReturnsStrategy,
    AmazonReturnsStrategy,
    ShopifyReturnsStrategy,
    TikTokReturnsStrategy,
  ],
  exports: [
    BullModule,
    SyncOutcomeService,
    PersistenceModule,
    ConnectorsModule,
    ShopifyProductsStrategy,
    FaireProductsStrategy,
    TargetProductsStrategy,
    WalmartProductsStrategy,
    AmazonProductsStrategy,
    WarehanceProductsStrategy,
    TikTokProductsStrategy,
    FaireOrdersStrategy,
    TargetOrdersStrategy,
    WalmartOrdersStrategy,
    AmazonOrdersStrategy,
    WarehanceOrdersStrategy,
    ShopifyOrdersStrategy,
    TikTokOrdersStrategy,
    TargetReturnsStrategy,
    WalmartReturnsStrategy,
    AmazonReturnsStrategy,
    ShopifyReturnsStrategy,
    TikTokReturnsStrategy,
  ],
})
export class SyncModule {}
