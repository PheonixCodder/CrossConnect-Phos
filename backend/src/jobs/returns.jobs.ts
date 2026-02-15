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
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { ShopifyService } from '../connectors/shopify/shopify.service';
import { AmazonService } from '../connectors/amazon/amazon.service';
import { WalmartService } from '../connectors/walmart/walmart.service';
import { TargetService } from '../connectors/target/target.service';
import { TikTokService } from '../connectors/tiktok/tiktok.service';
import { mapTiktokReturnsToDB } from '../connectors/tiktok/tiktok.mapper';

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
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient,
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
          await this.processTargetReturns(service as TargetService, store);
          break;
        case 'walmart':
          await this.processWalmartReturns(service as WalmartService, store);
          break;
        case 'amazon':
          await this.processAmazonReturns(service as AmazonService, store);
          break;
        case 'shopify':
          await this.processShopifyReturns(service as ShopifyService, store);
          break;
        case 'tiktok':
          await this.processTiktokReturns(service as TikTokService, store);
          break;
        default:
          this.logger.warn(
            `Returns sync not supported for platform: ${platform}`,
          );
          return;
      }

      // Update store health on success
      await this.storeRepo.updateStoreHealth(storeId, 'healthy');
      await this.supabaseClient
        .from('stores')
        .update({
          last_synced_at: new Date().toISOString(),
          last_returns_synced_at: new Date().toISOString(),
        })
        .eq('id', store.id);
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
    service: TargetService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_returns_synced_at
        ? new Date(store.last_returns_synced_at).toISOString()
        : undefined;

      // 1️⃣ Fetch ALL Target Returns
      const targetReturns: TargetProductReturn[] =
        await service.getAllProductReturns({ since });
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
    service: WalmartService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_returns_synced_at
        ? new Date(store.last_returns_synced_at).toISOString()
        : undefined;

      // 1️⃣ Fetch ALL Walmart Returns
      const walmartReturns: ReturnOrder[] | null =
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
    service: AmazonService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_returns_synced_at
        ? new Date(store.last_returns_synced_at).toISOString()
        : undefined;

      // 1️⃣ Fetch ALL Amazon Returns
      const reportReturns: AmazonReturnReportItem[] = await service.getReturns(
        store,
        since,
      );
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
    service: ShopifyService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    try {
      const since = store.last_returns_synced_at
        ? new Date(store.last_returns_synced_at).toISOString()
        : undefined;

      const ordersWithReturns = await service.fetchReturns(since);

      if (!ordersWithReturns.length) {
        this.logger.log('No returns found.');
        return;
      }

      const externalOrderIds = ordersWithReturns.map((o) => o.node.id);

      const dbOrders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      const orderIdMap = new Map(
        dbOrders.map((o) => [o.external_order_id, o.id]),
      );

      const returnInserts: Database['public']['Tables']['returns']['Insert'][] =
        [];

      for (const orderEdge of ordersWithReturns) {
        const orderNode = orderEdge.node;

        const internalOrderId = orderIdMap.get(orderNode.id);

        if (!internalOrderId) {
          this.logger.warn(
            `Return skipped — order not found in DB: ${orderNode.id}`,
          );
          continue;
        }

        for (const returnNode of orderNode.returns?.nodes || []) {
          returnInserts.push(
            mapShopifyReturnToDB(
              orderNode,
              returnNode,
              store.id,
              internalOrderId,
            ),
          );
        }
      }

      const deduped = Array.from(
        new Map(
          returnInserts.map((r) => [
            `${r.store_id}-${r.external_return_id}`,
            r,
          ]),
        ).values(),
      );

      if (deduped.length > 0) {
        const { error } = await this.returnsRepo.insertReturns(deduped);

        if (error) throw error;

        this.logger.log(`Synced ${deduped.length} returns.`);

        await this.storeRepo.update(store.id, 'returns', {
          last_synced_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(
        `${store.platform.toUpperCase()} returns failed for store ${store.id}`,
        error.stack,
      );
      throw error;
    }
  }

  private async processTiktokReturns(
    service: TikTokService,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    const since = store.last_orders_synced_at
      ? Math.floor(new Date(store.last_orders_synced_at).getTime() / 1000)
      : undefined;
    try {
      // 1️⃣ Fetch TikTok returns
      const tiktokReturns = await service.getAllReturns(store.id, since);

      if (!tiktokReturns?.length) {
        this.logger.log('No TikTok returns found');
        return;
      }

      // 2️⃣ Collect UNIQUE external order IDs
      const externalOrderIds = [
        ...new Set(
          tiktokReturns
            .map((r) => r.orderId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      if (!externalOrderIds.length) {
        this.logger.warn('TikTok returns missing order IDs');
        return;
      }

      // 3️⃣ Fetch matching orders (DO NOT MODIFY this method)
      const orders = await this.ordersRepo.getByExternalOrderIds(
        store.id,
        externalOrderIds,
      );

      if (!orders.length) {
        this.logger.warn(
          `No orders found for ${externalOrderIds.length} TikTok returns`,
        );
        return;
      }

      // 4️⃣ Build external → internal order ID map
      const orderIdMap = new Map<string, string>();
      for (const order of orders) {
        orderIdMap.set(order.external_order_id, order.id);
      }

      // 5️⃣ Map TikTok returns → DB rows (INTERNAL order_id)
      const returnsToInsert = mapTiktokReturnsToDB(
        tiktokReturns,
        store.id,
        orderIdMap,
      );

      if (!returnsToInsert.length) {
        this.logger.warn('No TikTok returns passed FK validation');
        return;
      }

      // 6️⃣ Upsert returns (DO NOT MODIFY this method)
      const { error } = await this.returnsRepo.insertReturns(returnsToInsert);
      if (error) throw error;

      this.logger.log(
        `Synced ${returnsToInsert.length} TikTok returns for store ${store.id}`,
      );
    } catch (error) {
      this.logger.error(
        `TIKTOK returns sync failed for store ${store.id}`,
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
        message: `TikTok returns sync failed: ${error.message}`,
        severity: 'high',
        platform: 'tiktok',
      });

      throw error;
    }
  }
}
