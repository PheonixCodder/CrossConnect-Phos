import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformServiceFactory } from '../connectors/platform-factory.service';
import { OrdersRepository } from '../supabase/repositories/orders.repository';
import { ReturnsRepository } from '../supabase/repositories/returns.repository';
import { StoresRepository } from '../supabase/repositories/stores.repository';
import { Database } from '../supabase/supabase.types';

// Import all mappers
import { mapAmazonReturnToDB } from '../connectors/amazon/amazon.mapper';
import { mapShopifyReturnToDB } from '../connectors/shopify/shopify.mapper';
import {
  mapTargetReturnsToDB,
  TargetProductReturn,
} from '../connectors/target/target.mapper';
import { mapWalmartReturnsToDB } from '../connectors/walmart/walmart.mapper';
import { StoreCredentialsService } from '../supabase/repositories/store_credentials.repository';
import { ReturnOrder } from '../connectors/walmart/walmart.types';
import { AmazonReturnReportItem } from '../connectors/amazon/amazon.types';
import { FetchReturnsQuery } from '../connectors/shopify/graphql/generated/admin.generated';
import { AlertsRepository } from '../supabase/repositories/alerts.repository';

@Processor('returns', { concurrency: 5 })
export class ReturnsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReturnsProcessor.name);

  constructor(
    private readonly platformFactory: PlatformServiceFactory,
    private readonly storeRepo: StoresRepository,
    private readonly ordersRepo: OrdersRepository,
    private readonly returnsRepo: ReturnsRepository,
    private readonly storeCredentialsService: StoreCredentialsService,
    private readonly alertsRepo: AlertsRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const {
      storeId,
      platform,
    }: {
      storeId: string;
      platform: Database['public']['Enums']['platform_types'];
      orgId: string;
    } = job.data;

    if (!storeId) {
      throw new Error('storeId is required');
    }

    if (!platform) {
      this.logger.warn(`Skipping job ${job.id}: missing/invalid platform`);
      return;
    }

    try {
      // Get store and credentials
      const store = await this.storeRepo.getStoreById(storeId);
      const credentials =
        await this.storeCredentialsService.getCredentialsByStoreId(storeId);

      // Create platform-specific service with credentials
      let service;
      try {
        service = this.platformFactory.createService(
          platform,
          credentials,
          store,
        );
      } catch (serviceError) {
        this.logger.error(
          `Failed to create service for ${platform}`,
          serviceError,
        );
        await this.storeRepo.updateStoreHealth(
          storeId,
          'unhealthy',
          `Failed to initialize platform service: ${serviceError.message}`,
        );
        throw serviceError;
      }

      // Process based on platform
      switch (platform) {
        case 'target':
          await this.processTargetReturns(service, store);
          break;
        case 'walmart':
          await this.processWalmartReturns(service, store);
          break;
        case 'amazon':
          await this.processAmazonReturns(service, store);
          break;
        case 'shopify':
          await this.processShopifyReturns(service, store);
          break;
        default:
          this.logger.warn(
            `Returns sync not supported for platform: ${platform}`,
          );
          return;
      }

      // Update store health on success
      await this.storeRepo.updateStoreHealth(storeId, 'healthy');
    } catch (error) {
      this.logger.error(
        `Failed to process returns for store ${storeId}: ${error.message}`,
        error.stack,
      );

      // Update store health on failure
      if (storeId) {
        await this.storeRepo.updateStoreHealth(
          storeId,
          'unhealthy',
          `Returns sync failed: ${error.message}`,
        );
      }

      throw error;
    }
  }

  private async processTargetReturns(
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch ALL Target Returns
      const targetReturns: TargetProductReturn[] =
        await service.getAllProductReturns();
      if (!targetReturns.length) {
        this.logger.warn('No returns returned from Target');
        return;
      }

      // 2️⃣ Collect UNIQUE external order IDs from returns
      const externalOrderIds: string[] = [
        ...new Set(targetReturns.map((r) => r.order_id)),
      ];

      if (!externalOrderIds.length) {
        this.logger.warn('No order IDs found in Target returns');
        return;
      }

      // 3️⃣ Fetch ONLY relevant orders from DB
      const orders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      if (!orders.length) {
        this.logger.warn(
          `No matching orders found for ${externalOrderIds.length} Target returns`,
        );
        return;
      }

      // 4️⃣ Build external_order_id → internal order.id map
      const orderIdMap = new Map<string, string>();
      orders.forEach((order) =>
        orderIdMap.set(order.external_order_id, order.id),
      );

      // 5️⃣ Map Target returns → DB returns (EXTERNAL order_id for now)
      const rawReturns = mapTargetReturnsToDB(targetReturns, store.id);

      // 6️⃣ Resolve FK: external order_id → internal order.id
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

      // 7️⃣ Insert returns
      const { error } = await this.returnsRepo.insertReturns(returnsDB);
      if (error) throw error;

      this.logger.log(`Successfully synced ${returnsDB.length} Target returns`);
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} product returns failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Returns sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'returns_sync_failure',
        message: `${store.platform.toUpperCase()} products returns sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }

  private async processWalmartReturns(
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_synced_at
        ? new Date(store.last_synced_at).toISOString()
        : undefined;

      // 1️⃣ Fetch ALL Walmart Returns
      const walmartReturns: ReturnOrder[] =
        await service.getWalmartProductReturns(since);
      if (!walmartReturns?.length) {
        this.logger.warn('No returns returned from Walmart');
        return;
      }

      // 2️⃣ Collect UNIQUE external order IDs from returns
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

      // 3️⃣ Fetch ONLY relevant orders from DB
      const orders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      if (!orders.length) {
        this.logger.warn(
          `No matching orders found for ${externalOrderIds.length} Walmart returns`,
        );
        return;
      }

      // 4️⃣ Build external_order_id → internal order.id map
      const orderIdMap = new Map<string, string>();
      orders.forEach((order) =>
        orderIdMap.set(order.external_order_id, order.id),
      );

      // 5️⃣ Map Walmart returns → DB returns (EXTERNAL order_id for now)
      const rawReturns = mapWalmartReturnsToDB(walmartReturns, store.id);

      // 6️⃣ Resolve FK: external order_id → internal order.id
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

      // 7️⃣ Insert returns
      const { error } = await this.returnsRepo.insertReturns(returnsDB);
      if (error) throw error;

      this.logger.log(
        `Successfully synced ${returnsDB.length} Walmart returns`,
      );
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} product returns failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Returns sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'returns_sync_failure',
        message: `${store.platform.toUpperCase()} product returns sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }

  private async processAmazonReturns(
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch ALL Amazon Returns
      const reportReturns: AmazonReturnReportItem[] =
        await service.getReturns(store);
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
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} product returns failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Returns sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'returns_sync_failure',
        message: `${store.platform.toUpperCase()} product returns sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }

  private async processShopifyReturns(
    service: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      // 1️⃣ Fetch the logistical return data
      const ordersWithReturns: FetchReturnsQuery['orders']['edges'] =
        await service.fetchReturns();
      if (!ordersWithReturns.length) return;

      // 2️⃣ Resolve internal order_id (FK)
      const externalOrderIds: string[] = ordersWithReturns
        .map((o) => o.node.id)
        .filter((id): id is string => typeof id === 'string');

      const dbOrders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
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
              store.id,
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
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} product returns failed for store ${store.id}`,
        error.stack,
      );

      await this.storeRepo.updateStoreHealth(
        store.id,
        'unhealthy',
        `Returns sync failed: ${error.message}`,
      );

      await this.alertsRepo.createAlert({
        store_id: store.id,
        alert_type: 'returns_sync_failure',
        message: `${store.platform.toUpperCase()} product returns sync failed: ${error.message}`,
        severity: 'high',
        platform: store.platform,
      });

      throw error;
    }
  }
}
