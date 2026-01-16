import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { mapAmazonReturnToDB } from 'src/connectors/amazon/amazon.mapper';
import { AmazonService } from 'src/connectors/amazon/amazon.service';
import { mapShopifyReturnToDB } from 'src/connectors/shopify/shopify.mapper';
import { ShopifyService } from 'src/connectors/shopify/shopify.service';
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
    private readonly shopifyService: ShopifyService,
    private readonly amazonService: AmazonService,
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
      if (!walmartReturns?.length) {
        this.logger.warn('No returns returned from Walmart');
        return;
      }
      // ------------------------------
      // 3️⃣ Collect UNIQUE external order IDs from returns
      // ------------------------------
      const externalOrderIds = [
        ...new Set(
          walmartReturns
            .map(
              (r) =>
                r.customerOrderId ?? r.returnOrderLines?.[0]?.purchaseOrderId,
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
    if (platform === 'amazon') {
      // ------------------------------
      // 1️⃣ Resolve Store
      // ------------------------------
      const store = await this.storeRepo.getStore(platform);
      if (!store) {
        throw new Error(`Store not found for platform: ${platform}`);
      }

      // ------------------------------
      // 2️⃣ Fetch ALL Amazon Returns
      // ------------------------------
      const reportReturns = await this.amazonService.getReturns(store);
      if (!reportReturns.length) return;

      // 2️⃣ Resolve orders
      const externalOrderIds = [
        ...new Set(reportReturns.map((r) => r.order_id)),
      ];

      const orders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      const orderIdByExternal = new Map(
        orders.map((o) => [o.external_order_id, o.id]),
      );

      // 3️⃣ Map returns (FK-safe)
      const inserts: Database['public']['Tables']['returns']['Insert'][] = [];

      for (const r of reportReturns) {
        const orderId = orderIdByExternal.get(r.order_id);
        if (!orderId) continue; // hard FK safety

        inserts.push(mapAmazonReturnToDB(r, store.id, orderId));
      }

      // 4️⃣ Upsert
      const { error } = await this.returnsRepo.insertReturns(inserts);
      if (error) throw error;

      this.logger.log(`Successfully synced ${inserts.length} Amazon returns`);
    }
    if (platform === 'shopify') {
      const storeId = await this.storeRepo.getStoreId(platform);
      if (!storeId) throw new Error(`Store not found for ${platform}`);

      // Fetch the logistical return data
      const ordersWithReturns = await this.shopifyService.fetchReturns();
      if (!ordersWithReturns.length) return;

      // Resolve internal order_id (FK)
      const externalOrderIds: string[] = ordersWithReturns
        .map((o) => o.node.id)
        .filter((id): id is string => typeof id === 'string');

      const dbOrders = await this.ordersRepo.getByExternalOrderIds(
        storeId,
        externalOrderIds,
      );
      const orderIdMap = new Map(
        dbOrders.map((o) => [o.external_order_id, o.id]),
      );

      const returnInserts: Database['public']['Tables']['returns']['Insert'][] =
        [];

      for (const orderNode of ordersWithReturns) {
        const internalOrderId = orderIdMap.get(orderNode.node.id);

        // Safety: Only map if the parent order exists in our DB
        if (!internalOrderId) {
          this.logger.warn(
            `Skipping return for order ${orderNode.node.id}: Order not found in DB.`,
          );
          continue;
        }

        // Map each Return record found in the order
        for (const returnNode of orderNode.node.returns?.nodes || []) {
          returnInserts.push(
            mapShopifyReturnToDB(
              orderNode.node,
              returnNode,
              storeId,
              internalOrderId,
            ),
          );
        }
      }

      if (returnInserts.length > 0) {
        const { error } = await this.returnsRepo.insertReturns(returnInserts);
        if (error) throw error;
        this.logger.log(`Synced ${returnInserts.length} logistical returns.`);
      }
    }
  }
}
