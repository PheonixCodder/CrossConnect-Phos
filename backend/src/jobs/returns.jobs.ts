import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { mapTargetReturnsToDB } from 'src/connectors/target/target.mapper';
import { TargetService } from 'src/connectors/target/target.service';
import { mapWalmartReturnsToDB } from 'src/connectors/walmart/walmart.mapper';
import { WalmartService } from 'src/connectors/walmart/walmart.service';
import { OrdersRepository } from 'src/supabase/repositories/orders.repository';
import { ReturnsRepository } from 'src/supabase/repositories/returns.repository';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { Database } from 'src/supabase/supabase.types';

@Processor('returns', { concurrency: 5 })
export class ReturnsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReturnsProcessor.name);

  constructor(
    private readonly storeRepo: StoresRepository,
    private readonly targetService: TargetService,
    private readonly walmartService: WalmartService,
    private readonly ordersRepo: OrdersRepository,
    private readonly returnsRepo: ReturnsRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const platform = job.data?.platform as string;
    if (!platform) {
      this.logger.warn(`Skipping job ${job.id}: missing/invalid platform`);
      return;
    }

    if (platform === 'target') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) {
        throw new Error(`Store not found for platform: ${platform}`);
      }

      // ------------------------------
      // 2️⃣ Fetch ALL Target Returns
      // ------------------------------
      const targetReturns = await this.targetService.getAllProductReturns();
      if (!targetReturns.length) {
        this.logger.warn('No returns returned from Target');
        return;
      }

      // ------------------------------
      // 3️⃣ Collect UNIQUE external order IDs from returns
      // ------------------------------
      const externalOrderIds = [
        ...new Set(targetReturns.map((r) => r.order_id)),
      ];

      if (!externalOrderIds.length) {
        this.logger.warn('No order IDs found in Target returns');
        return;
      }

      // ------------------------------
      // 4️⃣ Fetch ONLY relevant orders from DB
      // ------------------------------
      const orders = await this.ordersRepo.getByExternalOrderIds(
        storeId,
        externalOrderIds,
      );

      if (!orders.length) {
        this.logger.warn(
          `No matching orders found for ${externalOrderIds.length} Target returns`,
        );
        return;
      }

      // ------------------------------
      // 5️⃣ Build external_order_id → internal order.id map
      // ------------------------------
      const orderIdMap = new Map<string, string>();
      orders.forEach((order) =>
        orderIdMap.set(order.external_order_id, order.id),
      );

      // ------------------------------
      // 6️⃣ Map Target returns → DB returns (EXTERNAL order_id for now)
      // ------------------------------
      const rawReturns = mapTargetReturnsToDB(targetReturns, storeId);

      // ------------------------------
      // 7️⃣ Resolve FK: external order_id → internal order.id
      // ------------------------------
      const returnsDB: Database['public']['Tables']['returns']['Insert'][] =
        rawReturns
          .filter((ret) => orderIdMap.has(ret.order_id))
          .map((ret) => ({
            ...ret,
            order_id: orderIdMap.get(ret.order_id)!,
          }));

      if (!returnsDB.length) {
        this.logger.warn('No returns matched existing orders');
        return;
      }

      // ------------------------------
      // 8️⃣ Insert returns
      // ------------------------------
      const { error } = await this.returnsRepo.insertReturns(returnsDB);
      if (error) throw error;

      this.logger.log(`Successfully synced ${returnsDB.length} Target returns`);
    }
    if (platform === 'walmart') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) {
        throw new Error(`Store not found for platform: ${platform}`);
      }

      // ------------------------------
      // 2️⃣ Fetch ALL Walmart Returns
      // ------------------------------
      const walmartReturns =
        await this.walmartService.getWalmartProductReturns();
      if (!walmartReturns?.returnOrders.length) {
        this.logger.warn('No returns returned from Walmart');
        return;
      }
      // ------------------------------
      // 3️⃣ Collect UNIQUE external order IDs from returns
      // ------------------------------
      const externalOrderIds = [
        ...new Set(
          walmartReturns?.returnOrders
            .map(
              (r) =>
                r.customerOrderId! ?? r.returnOrderLines?.[0]?.purchaseOrderId,
            )
            .filter(Boolean),
        ),
      ];

      if (!externalOrderIds.length) {
        this.logger.warn('No order IDs found in Walmart returns');
        return;
      }
      // ------------------------------
      // 4️⃣ Fetch ONLY relevant orders from DB
      // ------------------------------
      const orders = await this.ordersRepo.getByExternalOrderIds(
        storeId,
        externalOrderIds,
      );

      if (!orders.length) {
        this.logger.warn(
          `No matching orders found for ${externalOrderIds.length} Walmart returns`,
        );
        return;
      }
      // ------------------------------
      // 5️⃣ Build external_order_id → internal order.id map
      // ------------------------------
      const orderIdMap = new Map<string, string>();
      orders.forEach((order) =>
        orderIdMap.set(order.external_order_id, order.id),
      );
      // ------------------------------
      // 6️⃣ Map Walmart returns → DB returns (EXTERNAL order_id for now)
      // ------------------------------
      const rawReturns = mapWalmartReturnsToDB(walmartReturns, storeId);

      // ------------------------------
      // 7️⃣ Resolve FK: external order_id → internal order.id
      // ------------------------------
      const returnsDB: Database['public']['Tables']['returns']['Insert'][] =
        rawReturns
          .filter((ret) => orderIdMap.has(ret.order_id))
          .map((ret) => ({
            ...ret,
            order_id: orderIdMap.get(ret.order_id)!,
          }));

      if (!returnsDB.length) {
        this.logger.warn('No returns matched existing orders');
        return;
      }

      // ------------------------------
      // 8️⃣ Insert returns
      // ------------------------------
      const { error } = await this.returnsRepo.insertReturns(returnsDB);
      if (error) throw error;

      this.logger.log(
        `Successfully synced ${returnsDB.length} Walmart returns`,
      );
    }
  }
}
