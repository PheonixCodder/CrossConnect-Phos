import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ProductsProcessor } from './products.jobs';
import { ProductsRepository } from 'src/supabase/repositories/products.repository';
import { OrdersProcessor } from './orders.jobs';
import { OrdersRepository } from 'src/supabase/repositories/orders.repository';
import { FaireModule } from 'src/connectors/faire/faire.module';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { OrderItemsRepository } from 'src/supabase/repositories/order_items.repository';
import { InventoryRepository } from 'src/supabase/repositories/inventory.repository';
import { FulfillmentsRepository } from 'src/supabase/repositories/fulfillments.repository';
import { TargetModule } from 'src/connectors/target/target.module';
import { WalmartModule } from 'src/connectors/walmart/walmart.module';
import { ReturnsProcessor } from './returns.jobs';
import { ReturnsRepository } from 'src/supabase/repositories/returns.repository';
import { AmazonModule } from 'src/connectors/amazon/amazon.module';
import { ShopifyModule } from 'src/connectors/shopify/shopify.module';
import { WarehanceModule } from 'src/connectors/warehouse/warehance.module';
import { PlatformServiceFactory } from 'src/connectors/platform-factory.service';
import { StoreCredentialsService } from 'src/supabase/repositories/store_credentials.repository';
import { SupabaseModule } from 'nestjs-supabase-js';
import { HttpModule } from '@nestjs/axios';
import { AlertsRepository } from 'src/supabase/repositories/alerts.repository';

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
