import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ProductsProcessor } from './products.jobs';
import { ProductsRepository } from '../supabase/repositories/products.repository';
import { OrdersProcessor } from './orders.jobs';
import { OrdersRepository } from '../supabase/repositories/orders.repository';
import { FaireModule } from '../connectors/faire/faire.module';
import { StoresRepository } from '../supabase/repositories/stores.repository';
import { OrderItemsRepository } from '../supabase/repositories/order_items.repository';
import { InventoryRepository } from '../supabase/repositories/inventory.repository';
import { FulfillmentsRepository } from '../supabase/repositories/fulfillments.repository';
import { TargetModule } from '../connectors/target/target.module';
import { WalmartModule } from '../connectors/walmart/walmart.module';
import { ReturnsProcessor } from './returns.jobs';
import { ReturnsRepository } from '../supabase/repositories/returns.repository';
import { AmazonModule } from '../connectors/amazon/amazon.module';
import { ShopifyModule } from '../connectors/shopify/shopify.module';
import { WarehanceModule } from '../connectors/warehouse/warehance.module';
import { PlatformServiceFactory } from '../connectors/platform-factory.service';
import { StoreCredentialsService } from '../supabase/repositories/store_credentials.repository';
import { SupabaseModule } from 'nestjs-supabase-js';
import { HttpModule } from '@nestjs/axios';
import { AlertsRepository } from '../supabase/repositories/alerts.repository';

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
    FaireModule,
    WalmartModule,
    TargetModule,
    AmazonModule,
    ShopifyModule,
    WarehanceModule,
    SupabaseModule.injectClient(),
    HttpModule,
  ],
  providers: [
    // Processors
    ProductsProcessor,
    OrdersProcessor,
    ReturnsProcessor,

    // Repositories
    ProductsRepository,
    OrdersRepository,
    StoresRepository,
    OrderItemsRepository,
    InventoryRepository,
    FulfillmentsRepository,
    ReturnsRepository,
    AlertsRepository,

    // Services
    PlatformServiceFactory,
    StoreCredentialsService,
  ],
  exports: [
    BullModule, // Repositories
    ProductsRepository,
    OrdersRepository,
    StoresRepository,
    OrderItemsRepository,
    InventoryRepository,
    FulfillmentsRepository,
    ReturnsRepository,
    AlertsRepository,

    // Services
    PlatformServiceFactory,
    StoreCredentialsService,
  ],
})
export class JobsModule {}
