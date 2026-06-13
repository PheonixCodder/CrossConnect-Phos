import { Module } from '@nestjs/common';
import { SupabaseModule } from 'nestjs-supabase-js';
import {
  ALERTS_REPOSITORY,
  FULFILLMENTS_REPOSITORY,
  INVENTORY_REPOSITORY,
  METRICS_REPOSITORY,
  ORDER_ITEMS_REPOSITORY,
  ORDERS_REPOSITORY,
  PRODUCTS_REPOSITORY,
  RETURNS_REPOSITORY,
  STORE_CREDENTIALS_REPOSITORY,
  STORES_REPOSITORY,
} from '../domain/repositories/repository-ports';
import { AlertsRepository } from '../infrastructure/persistence/supabase/repositories/alerts.repository';
import { FulfillmentsRepository } from '../infrastructure/persistence/supabase/repositories/fulfillments.repository';
import { InventoryRepository } from '../infrastructure/persistence/supabase/repositories/inventory.repository';
import { MetricsRepository } from '../infrastructure/persistence/supabase/repositories/metrics.repository';
import { OrderItemsRepository } from '../infrastructure/persistence/supabase/repositories/order_items.repository';
import { OrdersRepository } from '../infrastructure/persistence/supabase/repositories/orders.repository';
import { ProductsRepository } from '../infrastructure/persistence/supabase/repositories/products.repository';
import { ReturnsRepository } from '../infrastructure/persistence/supabase/repositories/returns.repository';
import { StoreCredentialsService } from '../infrastructure/persistence/supabase/repositories/store_credentials.repository';
import { StoresRepository } from '../infrastructure/persistence/supabase/repositories/stores.repository';

@Module({
  imports: [SupabaseModule.injectClient()],
  providers: [
    ProductsRepository,
    OrdersRepository,
    StoresRepository,
    OrderItemsRepository,
    InventoryRepository,
    FulfillmentsRepository,
    ReturnsRepository,
    AlertsRepository,
    MetricsRepository,
    StoreCredentialsService,
    {
      provide: STORES_REPOSITORY,
      useExisting: StoresRepository,
    },
    {
      provide: STORE_CREDENTIALS_REPOSITORY,
      useExisting: StoreCredentialsService,
    },
    {
      provide: ALERTS_REPOSITORY,
      useExisting: AlertsRepository,
    },
    {
      provide: PRODUCTS_REPOSITORY,
      useExisting: ProductsRepository,
    },
    {
      provide: INVENTORY_REPOSITORY,
      useExisting: InventoryRepository,
    },
    {
      provide: ORDERS_REPOSITORY,
      useExisting: OrdersRepository,
    },
    {
      provide: ORDER_ITEMS_REPOSITORY,
      useExisting: OrderItemsRepository,
    },
    {
      provide: FULFILLMENTS_REPOSITORY,
      useExisting: FulfillmentsRepository,
    },
    {
      provide: METRICS_REPOSITORY,
      useExisting: MetricsRepository,
    },
    {
      provide: RETURNS_REPOSITORY,
      useExisting: ReturnsRepository,
    },
  ],
  exports: [
    ProductsRepository,
    OrdersRepository,
    StoresRepository,
    OrderItemsRepository,
    InventoryRepository,
    FulfillmentsRepository,
    ReturnsRepository,
    AlertsRepository,
    MetricsRepository,
    StoreCredentialsService,
    STORES_REPOSITORY,
    STORE_CREDENTIALS_REPOSITORY,
    ALERTS_REPOSITORY,
    PRODUCTS_REPOSITORY,
    INVENTORY_REPOSITORY,
    ORDERS_REPOSITORY,
    ORDER_ITEMS_REPOSITORY,
    FULFILLMENTS_REPOSITORY,
    METRICS_REPOSITORY,
    RETURNS_REPOSITORY,
  ],
})
export class PersistenceModule {}
