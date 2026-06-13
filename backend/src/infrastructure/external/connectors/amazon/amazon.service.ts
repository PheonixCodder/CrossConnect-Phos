import { Injectable, Logger } from '@nestjs/common';
import { SellingPartnerApiAuth } from '@sp-api-sdk/auth';
import { ReportsApiClient } from '@sp-api-sdk/reports-api-2021-06-30';
import {
  Order,
  OrderItem,
  OrdersApiClient,
  OrdersApiGetOrdersRequest,
} from '@sp-api-sdk/orders-api-v0';
import {
  DataKioskApiClient,
  Query,
} from '@sp-api-sdk/data-kiosk-api-2023-11-15';
import {
  FbaInventoryApiClient,
  InventorySummary,
} from '@sp-api-sdk/fba-inventory-api-v1';
import axios from 'axios';
import * as zlib from 'zlib';
import {
  AmazonMerchantListingRow,
  AmazonReturnReportItem,
} from './amazon.types';
import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
import { SellingPartnerRegion } from '@sp-api-sdk/common';
import { CryptoService } from '../../../../shared/crypto/crypto.service';
import { OrderMetricsInterval, SalesApiClient } from '@sp-api-sdk/sales-api-v1';
import { KioskSalesAndTrafficRow } from './amazon.mapper';
import { SpApiThrottleManager } from './throttle.manager';

@Injectable()
export class AmazonService {
  private readonly logger = new Logger(AmazonService.name);
  private auth: SellingPartnerApiAuth;

  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;

  private region = 'na';
  private readonly AMAZON_PAGE_SIZE = 100;
  private readonly AMAZON_CHUNK_DAYS = 30;
  private readonly AMAZON_FULL_SYNC_START = new Date(
    '2026-01-01T00:00:00.000Z',
  );
  private readonly MARKETPLACE_ID = 'ATVPDKIKX0DER';

  constructor(
    private readonly crypto: CryptoService,
    private readonly throttle: SpApiThrottleManager,
  ) {}

  /* -------------------- INIT -------------------- */

  initialize(credentials: any): void {
    this.clientId = this.crypto.decrypt(credentials.lwa_client_id);
    this.clientSecret = this.crypto.decrypt(credentials.lwa_client_secret);
    this.refreshToken = this.crypto.decrypt(credentials.refresh_token);

    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error('Amazon OAuth credentials missing');
    }

    this.auth = new SellingPartnerApiAuth({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      refreshToken: this.refreshToken,
    });
  }

  /* ================================================================
     PRODUCTS SNAPSHOT
  ================================================================= */

  async getAllProducts(
    store: Database['public']['Tables']['stores']['Row'],
  ): Promise<AmazonMerchantListingRow[]> {
    const client = new ReportsApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const create = await this.throttle.execute(
      'REPORTS',
      () =>
        client.createReport({
          body: {
            reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
            marketplaceIds: [this.MARKETPLACE_ID],
          },
        }),
      'createListingsReport',
    );

    const reportId = create.data.reportId;
    let report: any;

    for (let i = 0; i < 15; i++) {
      await this.sleep(30_000);

      report = await this.throttle.execute(
        'REPORTS',
        () => client.getReport({ reportId }),
        'getListingsReportStatus',
      );

      if (report.data.processingStatus === 'DONE') break;
      if (report.data.processingStatus === 'CANCELLED')
        throw new Error('Listings report cancelled');
    }

    if (report?.data?.processingStatus !== 'DONE')
      throw new Error('Listings report timeout');

    const doc = await this.throttle.execute(
      'REPORTS',
      () =>
        client.getReportDocument({
          reportDocumentId: report.data.reportDocumentId!,
        }),
      'getListingsReportDocument',
    );

    const raw = await axios.get(doc.data.url as string, {
      responseType: 'arraybuffer',
    });

    let buffer = Buffer.from(raw.data);
    if (doc.data.compressionAlgorithm === 'GZIP')
      buffer = zlib.gunzipSync(buffer);

    return this.parseTSV(buffer.toString('utf8'));
  }

  /* ================================================================
     INVENTORY
  ================================================================= */

  async getInventorySummaries(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<InventorySummary[]> {
    const client = new FbaInventoryApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const results: InventorySummary[] = [];
    let nextToken: string | undefined;

    do {
      const res = await this.throttle.execute(
        'INVENTORY',
        () =>
          client.getInventorySummaries({
            marketplaceIds: [this.MARKETPLACE_ID],
            granularityType: 'Marketplace',
            granularityId: this.MARKETPLACE_ID,
            startDateTime: since,
            nextToken,
          }),
        'getInventorySummaries',
      );

      results.push(...(res.data.payload.inventorySummaries ?? []));
      nextToken = res.data.pagination?.nextToken;
    } while (nextToken);

    return results;
  }

  /* ================================================================
     SALES API
  ================================================================= */

  async getDailySalesMetrics(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<OrderMetricsInterval[]> {
    const client = new SalesApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const start = since ? new Date(since) : this.AMAZON_FULL_SYNC_START;
    const end = new Date();

    const interval = `${start.toISOString()}--${end.toISOString()}`;

    const res = await this.throttle.execute(
      'SALES',
      () =>
        client.getOrderMetrics({
          marketplaceIds: [this.MARKETPLACE_ID],
          interval,
          granularity: 'Day',
        }),
      'getOrderMetrics',
    );

    return res.data.payload ?? [];
  }

  /* ================================================================
     DATA KIOSK (STABLE VERSION)
  ================================================================= */

  async getDailySalesDataKiosk(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<KioskSalesAndTrafficRow[]> {
    const client = new DataKioskApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const startDate = since ? new Date(since) : this.AMAZON_FULL_SYNC_START;
    const endDate = new Date();

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const query = `
query {
  analytics_salesAndTraffic_2024_04_24 {
    salesAndTrafficByDate(
      startDate: "${startStr}"
      endDate: "${endStr}"
      marketplaceIds: ["${this.MARKETPLACE_ID}"]
      aggregateBy: DAY
    ) {
      startDate
      sales {
        orderedProductSales { amount currencyCode }
        totalOrderItems
        unitsOrdered
      }
    }
  }
}`;

    const create = await this.throttle.execute(
      'DATA_KIOSK',
      () => client.createQuery({ body: { query } }),
      'createKioskQuery',
    );

    const queryId = create.data.queryId;
    let status: Query | null = null;

    for (let i = 0; i < 30; i++) {
      await this.sleep(90_000);

      const res = await this.throttle.execute(
        'DATA_KIOSK',
        () => client.getQuery({ queryId }),
        'getKioskStatus',
      );

      status = res.data;

      if (status?.processingStatus === 'DONE') break;
      if (['CANCELLED', 'FATAL'].includes(status?.processingStatus ?? ''))
        return [];
    }

    if (!status?.dataDocumentId) return [];

    const doc = await this.throttle.execute(
      'DATA_KIOSK',
      () => client.getDocument({ documentId: status.dataDocumentId! }),
      'getKioskDoc',
    );

    const response = await axios.get(doc.data.documentUrl as string);

    const lines = response.data.split('\n').filter((l: string) => l.trim());
    const parsed = lines.map((l: string) => JSON.parse(l));

    return parsed ?? [];
  }

  /* ================================================================
     ORDERS
  ================================================================= */

  public async getOrders(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<Order[]> {
    const client = new OrdersApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const normalized =
      since && since.trim().length > 0
        ? since
        : this.AMAZON_FULL_SYNC_START.toISOString();

    const orders = since
      ? await this.getOrdersPaged(client, 'updated', normalized)
      : await this.getOrdersPaged(client, 'created', normalized);

    return this.deduplicateOrders(orders);
  }

  private async getOrdersPaged(
    client: OrdersApiClient,
    mode: 'created' | 'updated',
    startISO: string,
  ): Promise<Order[]> {
    const orders: Order[] = [];
    let nextToken: string | undefined;

    do {
      const params: any = {
        marketplaceIds: [this.MARKETPLACE_ID],
        maxResultsPerPage: this.AMAZON_PAGE_SIZE,
      };

      if (nextToken) {
        params.nextToken = nextToken;
      } else if (mode === 'created') params.createdAfter = startISO;
      else params.lastUpdatedAfter = startISO;

      const res = await this.throttle.execute(
        'ORDERS',
        () => client.getOrders(params),
        'getOrdersPaged',
      );

      orders.push(...(res.data.payload?.Orders ?? []));
      nextToken = res.data.payload?.NextToken;
    } while (nextToken);

    return orders;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const client = new OrdersApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const items: OrderItem[] = [];
    let nextToken: string | undefined;

    do {
      const res = await this.throttle.execute(
        'ORDERS',
        () => client.getOrderItems({ orderId, nextToken }),
        'getOrderItems',
      );

      items.push(...(res.data.payload?.OrderItems ?? []));
      nextToken = res.data.payload?.NextToken;
    } while (nextToken);

    return items;
  }

  async getOrdersFlatFileReport(
    store: Database['public']['Tables']['stores']['Row'],
  ): Promise<any[]> {
    const client = new ReportsApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const allOrders: any[] = [];
    const CHUNK_SIZE_DAYS = 30;

    let currentStart = new Date(this.AMAZON_FULL_SYNC_START);
    const finalEnd = new Date();

    while (currentStart < finalEnd) {
      let currentEnd = new Date(
        currentStart.getTime() + CHUNK_SIZE_DAYS * 24 * 60 * 60 * 1000,
      );

      if (currentEnd > finalEnd) currentEnd = finalEnd;

      this.logger.log(
        `Fetching Amazon flat file orders from ${currentStart.toISOString()} to ${currentEnd.toISOString()}`,
      );

      const create = await this.throttle.execute(
        'REPORTS',
        () =>
          client.createReport({
            body: {
              reportType: 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
              marketplaceIds: [this.MARKETPLACE_ID],
              dataStartTime: currentStart.toISOString(),
              dataEndTime: currentEnd.toISOString(),
            },
          }),
        'createOrdersFlatFileReport',
      );

      const reportId = create.data.reportId;
      let report: any;

      for (let i = 0; i < 20; i++) {
        await this.sleep(30_000);

        report = await this.throttle.execute(
          'REPORTS',
          () => client.getReport({ reportId }),
          'getOrdersFlatFileReportStatus',
        );

        const status = report?.data?.processingStatus;

        if (status === 'DONE') break;

        if (['CANCELLED', 'FATAL'].includes(status)) {
          this.logger.error(
            `Orders flat file report failed for range ${currentStart.toISOString()} - ${status}`,
          );
          break;
        }
      }

      if (report?.data?.processingStatus === 'DONE') {
        const doc = await this.throttle.execute(
          'REPORTS',
          () =>
            client.getReportDocument({
              reportDocumentId: report.data.reportDocumentId!,
            }),
          'getOrdersFlatFileReportDoc',
        );

        const raw = await axios.get(doc.data.url as string, {
          responseType: 'arraybuffer',
        });

        let buffer = Buffer.from(raw.data);

        if (doc.data.compressionAlgorithm === 'GZIP') {
          buffer = zlib.gunzipSync(buffer);
        }

        const parsedChunk = this.parseTSV(buffer.toString('utf8'));
        allOrders.push(...parsedChunk);
      }

      currentStart = new Date(currentEnd.getTime() + 1);

      // Important: spacing report creations prevents 429
      await this.sleep(5000);
    }

    this.logger.log(
      `Amazon flat file sync completed: ${allOrders.length} rows`,
    );

    return allOrders;
  }

  async getReturns(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<AmazonReturnReportItem[]> {
    const client = new ReportsApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const startTime = since || oneYearAgo.toISOString();

    this.logger.log(`Requesting FBA Returns since: ${startTime}`);

    const create = await this.throttle.execute(
      'REPORTS',
      () =>
        client.createReport({
          body: {
            reportType: 'GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA',
            marketplaceIds: [this.MARKETPLACE_ID],
            dataStartTime: startTime,
          },
        }),
      'createFbaReturnsReport',
    );

    const reportId = create.data.reportId;
    let report: any;

    for (let i = 0; i < 20; i++) {
      await this.sleep(45_000);

      report = await this.throttle.execute(
        'REPORTS',
        () => client.getReport({ reportId }),
        'getFbaReturnsStatus',
      );

      const status = report?.data?.processingStatus;

      if (status === 'DONE') break;

      if (['CANCELLED', 'FATAL'].includes(status)) {
        throw new Error(`FBA Returns report ${reportId} failed: ${status}`);
      }
    }

    if (report?.data?.processingStatus !== 'DONE') {
      throw new Error(
        `FBA Returns report timeout: ${report?.data?.processingStatus}`,
      );
    }

    const doc = await this.throttle.execute(
      'REPORTS',
      () =>
        client.getReportDocument({
          reportDocumentId: report.data.reportDocumentId!,
        }),
      'getFbaReturnsDoc',
    );

    const raw = await axios.get(doc.data.url as string, {
      responseType: 'arraybuffer',
    });

    let buffer = Buffer.from(raw.data);

    if (doc.data.compressionAlgorithm === 'GZIP') {
      buffer = zlib.gunzipSync(buffer);
    }

    return this.parseFbaReturnsFlatFile(buffer.toString('utf8'));
  }

  private parseFbaReturnsFlatFile(data: string): AmazonReturnReportItem[] {
    const rows = this.parseTSV(data);

    return rows.map((r) => ({
      return_date: r['return-date'],
      order_id: r['order-id'],
      sku: r['sku'],
      asin: r['asin'],
      fnsku: r['fnsku'],
      product_name: r['product-name'],
      quantity: Number(r['quantity'] ?? 0),
      fulfillment_center_id: r['fulfillment-center-id'],
      detailed_disposition: r['detailed-disposition'],
      reason: r['reason'],
      status: r['status'],
      license_plate_number: r['license-plate-number'],
      customer_comments: r['customer-comments'],

      // Maintain compatibility with your DB mappers
      item_name: r['product-name'],
      merchant_sku: r['sku'],
      return_request_date: r['return-date'],
      return_type: 'FBA',
    }));
  }

  /* ================================================================
     HELPERS
  ================================================================= */

  private deduplicateOrders(orders: Order[]): Order[] {
    const map = new Map<string, Order>();
    for (const o of orders) if (o.AmazonOrderId) map.set(o.AmazonOrderId, o);
    return [...map.values()];
  }

  private parseTSV(data: string) {
    const lines = data.trim().split(/\r?\n/);
    const headers = lines.shift()!.split('\t');

    return lines.map((line) => {
      const values = line.split('\t');
      const row: any = {};
      headers.forEach((h, i) => (row[h] = values[i] ?? null));
      return row;
    });
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
