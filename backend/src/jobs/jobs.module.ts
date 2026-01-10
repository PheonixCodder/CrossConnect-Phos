import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ProductsProcessor } from './products.jobs';
import { ProductsRepository } from 'src/supabase/repositories/products.repository';
import { OrdersProcessor } from './orders.jobs';
import { OrdersRepository } from 'src/supabase/repositories/orders.repository';
import { FaireModule } from 'src/connectors/faire/faire.module';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { SupabaseModule } from 'nestjs-supabase-js';
import { OrderItemsRepository } from 'src/supabase/repositories/order_items.repository';
import { InventoryRepository } from 'src/supabase/repositories/inventory.repository';
import { FulfillmentsRepository } from 'src/supabase/repositories/fulfillments.repository';

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
    FaireModule,
    SupabaseModule.injectClient(),
  ],
  providers: [
    ProductsProcessor,
    ProductsRepository,
    OrdersProcessor,
    OrdersRepository,
    StoresRepository,
    OrderItemsRepository,
    InventoryRepository,
    FulfillmentsRepository,
  ],
  exports: [BullModule],
})
export class JobsModule {}
