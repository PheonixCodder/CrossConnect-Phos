import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { mapOrdersToDB } from 'src/connectors/faire/faire.mapper';
import { FaireService } from 'src/connectors/faire/faire.service';
import { FulfillmentsRepository } from 'src/supabase/repositories/fulfillments.repository';
import { OrderItemsRepository } from 'src/supabase/repositories/order_items.repository';
import { OrdersRepository } from 'src/supabase/repositories/orders.repository';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';

@Processor('orders', { concurrency: 5 })
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly faireService: FaireService,
    private readonly ordersRepo: OrdersRepository,
    private readonly orderItemsRepo: OrderItemsRepository,
    private readonly storeRepo: StoresRepository,
    private readonly shipmentRepo: FulfillmentsRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const platform = job.data.platform as string;
    if (platform === 'FAIRE') {
      // 1️⃣ Fetch store
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) {
        throw new Error(`Store not found for platform: ${platform}`);
      }
      // 2️⃣ Fetch orders
      const { orders } = await this.faireService.getOrders();
      if (!orders || orders.length === 0) {
        this.logger.warn('No orders fetched from Faire');
        return;
      }

      // 3️⃣ Map to DB schema (orders + items + shipments)
      const {
        orders: newOrders,
        orderItems,
        shipments,
      } = mapOrdersToDB(orders, storeId);

      if (newOrders.length === 0) {
        this.logger.warn('No orders mapped from Faire');
        return;
      }

      // 4️⃣ Atomic sync: orders + items + shipments
      try {
        const { error } = await this.ordersRepo.syncOrdersItemsAndShipments(
          newOrders,
          orderItems,
          shipments,
        );

        if (error) {
          this.logger.error('Atomic FAIRE order sync failed', error);
          throw error;
        }

        this.logger.log(
          `Successfully synced ${newOrders.length} orders, ${orderItems.length} items, ${shipments.length} shipments`,
        );
      } catch (err) {
        this.logger.error('Failed to sync FAIRE orders atomically', err);
        throw err;
      }
    }
  }
}
