import { parseStringPromise } from 'xml2js';
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
  FbaInventoryApiClient,
  InventorySummary,
} from '@sp-api-sdk/fba-inventory-api-v1';
import axios from 'axios';
import * as zlib from 'zlib';
import {
  AmazonMerchantListingRow,
  AmazonReturnReportItem,
} from './amazon.types';
import { Database } from '../../supabase/supabase.types';
import { SellingPartnerRegion } from '@sp-api-sdk/common';
import { CryptoService } from '../../common/crypto.service';
import { AmazonOrderReportRow } from 'connectors/amazon/amazon.mapper';

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

  constructor(private readonly crypto: CryptoService) {}

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

  /* -------------------- RETRY + BACKOFF -------------------- */

  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string,
    maxRetries = 8,
    baseDelayMs = 7000,
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;

        const status =
          err?.response?.statusCode ?? err?.response?.status ?? err?.statusCode;

        const retryable = status === 429 || (status >= 500 && status < 600);

        if (!retryable || attempt > maxRetries) {
          this.logger.error(
            `Amazon API failed [${context}] after ${attempt} attempts`,
            err?.stack ?? err,
          );
          throw err;
        }

        const backoff =
          baseDelayMs * Math.pow(2, attempt - 1) +
          Math.floor(Math.random() * 300);

        this.logger.warn(
          `Amazon API retry ${attempt}/${maxRetries} [${context}] in ${backoff}ms`,
        );

        await this.sleep(backoff);
      }
    }
  }

  /* -------------------- PRODUCTS (SNAPSHOT) -------------------- */

  async getAllProducts(
    store: Database['public']['Tables']['stores']['Row'],
  ): Promise<AmazonMerchantListingRow[]> {
    const client = new ReportsApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const { data } = await this.withRetry(
      () =>
        client.createReport({
          body: {
            reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
            marketplaceIds: [store.marketplaceId!],
          },
        }),
      'createListingsReport',
    );

    const reportId = data.reportId;
    let report;

    for (let i = 0; i < 15; i++) {
      await this.sleep(30_000);

      report = await this.withRetry(
        () => client.getReport({ reportId }),
        'getListingsReportStatus',
      );

      if (report.data.processingStatus === 'DONE') break;
      if (report.data.processingStatus === 'CANCELLED') {
        throw new Error('Listings report cancelled');
      }
    }

    if (report.data.processingStatus !== 'DONE') {
      throw new Error('Listings report timeout');
    }

    const doc = await this.withRetry(
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

    if (doc.data.compressionAlgorithm === 'GZIP') {
      buffer = zlib.gunzipSync(buffer);
    }

    return this.parseTSV(buffer.toString('utf8'));
  }

  /* -------------------- INVENTORY (DELTA) -------------------- */

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
      const { data } = await this.withRetry(
        () =>
          client.getInventorySummaries({
            marketplaceIds: [store.marketplaceId!],
            granularityType: 'Marketplace',
            granularityId: store.marketplaceId!,
            startDateTime: since,
            nextToken,
          }),
        'getInventorySummaries',
      );

      results.push(
        ...((data.payload.inventorySummaries as InventorySummary[]) ?? []),
      );

      nextToken = data.pagination?.nextToken;
    } while (nextToken);

    return results;
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
    const finalEnd = new Date(); // Current time

    // Loop through time in 30-day increments
    while (currentStart < finalEnd) {
      let currentEnd = new Date(
        currentStart.getTime() + CHUNK_SIZE_DAYS * 24 * 60 * 60 * 1000,
      );

      // Ensure we don't request a future date
      if (currentEnd > finalEnd) {
        currentEnd = finalEnd;
      }

      this.logger.log(
        `Fetching Amazon orders from ${currentStart.toISOString()} to ${currentEnd.toISOString()}`,
      );

      const { data } = await this.withRetry(
        () =>
          client.createReport({
            body: {
              reportType: 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
              marketplaceIds: [store.marketplaceId!],
              dataStartTime: currentStart.toISOString(),
              dataEndTime: currentEnd.toISOString(),
            },
          }),
        'createOrdersFlatFileReport',
      );

      const reportId = data.reportId;
      let report;

      // Wait for the specific chunk to process
      for (let i = 0; i < 20; i++) {
        await this.sleep(30_000);
        report = await this.withRetry(
          () => client.getReport({ reportId }),
          'getOrdersFlatFileReportStatus',
        );

        if (report.data.processingStatus === 'DONE') break;
        if (
          ['CANCELLED', 'FATAL'].includes(
            report.data.processingStatus as string,
          )
        ) {
          this.logger.error(
            `Report failed for range ${currentStart.toISOString()}`,
          );
          break;
        }
      }

      if (report?.data?.processingStatus === 'DONE') {
        const doc = await this.withRetry(
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

      // Move start date forward for next iteration (add 1ms to avoid overlap)
      currentStart = new Date(currentEnd.getTime() + 1);

      // Rate limiting: Amazon throttles report creation.
      // Small delay between chunks helps avoid 429 errors.
      await this.sleep(2000);
    }

    this.logger.log(
      `Amazon orders sync completed: ${allOrders.length} total orders found.`,
    );
    return allOrders;
  }

  public async getOrders(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<Order[]> {
    const client = new OrdersApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    // 🔒 Normalize cursor: always fallback to AMAZON_FULL_SYNC_START
    const normalizedSince =
      since && since.trim().length > 0
        ? since
        : this.AMAZON_FULL_SYNC_START.toISOString();

    let orders: Order[];

    if (!since) {
      // FULL SYNC → use chunked by created date
      orders = await this.getOrdersChunked(client, store);
    } else {
      // DELTA SYNC → last updated
      orders = await this.getOrdersDelta(client, store, normalizedSince);
    }

    return this.deduplicateOrders(orders);
  }

  private async getOrdersDelta(
    client: OrdersApiClient,
    store: Database['public']['Tables']['stores']['Row'],
    since: string,
  ): Promise<Order[]> {
    return this.getOrdersPaged(client, store, 'updated', since);
  }

  private async getOrdersChunked(
    client: OrdersApiClient,
    store: Database['public']['Tables']['stores']['Row'],
  ): Promise<Order[]> {
    const all: Order[] = [];
    const now = new Date(Date.now() - 2 * 60 * 1000); // safety 2 min

    let cursor = new Date(this.AMAZON_FULL_SYNC_START);

    while (cursor < now) {
      const end = new Date(cursor);
      end.setDate(end.getDate() + this.AMAZON_CHUNK_DAYS);
      if (end > now) end.setTime(now.getTime());

      const chunk = await this.getOrdersPaged(
        client,
        store,
        'created',
        cursor.toISOString(),
        end.toISOString(),
      );

      all.push(...chunk);

      cursor = new Date(end.getTime() + 1000); // +1s overlap protection
      await this.sleep(1500); // avoid throttling
    }

    return this.deduplicateOrders(all);
  }

  private async getOrdersPaged(
    client: OrdersApiClient,
    store: Database['public']['Tables']['stores']['Row'],
    mode: 'created' | 'updated',
    startISO: string,
    endISO?: string,
  ): Promise<Order[]> {
    const orders: Order[] = [];
    let nextToken: string | undefined;

    do {
      const params: any = {
        marketplaceIds: [store.marketplaceId!],
        maxResultsPerPage: this.AMAZON_PAGE_SIZE,
      };

      if (nextToken) {
        params.nextToken = nextToken; // Ensure camelCase
      } else if (mode === 'created') {
        params.createdAfter = startISO; // lowercase 'c'
        if (endISO) params.createdBefore = endISO; // lowercase 'c'
      } else {
        params.lastUpdatedAfter = startISO; // lowercase 'l'
        if (endISO) params.lastUpdatedBefore = endISO; // lowercase 'l'
      }

      const { data } = await this.withRetry(
        () => client.getOrders(params),
        'getOrdersPaged',
      );

      orders.push(...((data.payload?.Orders as Order[]) ?? []));
      nextToken = data.payload?.NextToken;
    } while (nextToken);

    return orders;
  }
  private deduplicateOrders(orders: Order[]): Order[] {
    const map = new Map<string, Order>();
    for (const o of orders) {
      if (o.AmazonOrderId) map.set(o.AmazonOrderId, o);
    }
    return [...map.values()];
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const client = new OrdersApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const items: OrderItem[] = [];
    let nextToken: string | undefined;

    do {
      const { data } = await this.withRetry(
        () => client.getOrderItems({ orderId, nextToken }),
        'getOrderItems',
      );

      items.push(...((data.payload.OrderItems as OrderItem[]) ?? []));
      nextToken = data.payload?.NextToken;
    } while (nextToken);

    return items;
  }

  /* -------------------- RETURNS (SNAPSHOT + FILTER) -------------------- */

  async getReturns(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<AmazonReturnReportItem[]> {
    const client = new ReportsApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    // Calculate 1 year ago as fallback
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startTime = since || oneYearAgo.toISOString();

    this.logger.log(`Requesting FBA Returns Report since: ${startTime}`);

    const { data } = await this.withRetry(
      () =>
        client.createReport({
          body: {
            reportType: 'GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA',
            marketplaceIds: [store.marketplaceId!],
            dataStartTime: startTime,
          },
        }),
      'createFbaReturnsReport',
    );

    const reportId = data.reportId;
    let report;

    // Poll for completion (FBA reports can take several minutes)
    for (let i = 0; i < 20; i++) {
      await this.sleep(45_000);
      report = await this.withRetry(
        () => client.getReport({ reportId }),
        'getFbaStatus',
      );

      if (report.data.processingStatus === 'DONE') break;
      if (
        ['CANCELLED', 'FATAL'].includes(report.data.processingStatus as string)
      ) {
        throw new Error(
          `FBA Report ${reportId} failed: ${report.data.processingStatus}`,
        );
      }
    }
    if (report.data.processingStatus !== 'DONE') {
      throw new Error(
        `FBA Returns report timed out (status: ${report.data.processingStatus})`,
      );
    }

    const doc = await this.withRetry(
      () =>
        client.getReportDocument({
          reportDocumentId: report.data.reportDocumentId!,
        }),
      'getFbaDoc',
    );

    const raw = await axios.get(doc.data.url as string, {
      responseType: 'arraybuffer',
    });
    let buffer = Buffer.from(raw.data);
    if (doc.data.compressionAlgorithm === 'GZIP')
      buffer = zlib.gunzipSync(buffer);

    return this.parseFbaReturnsFlatFile(buffer.toString('utf8'));
  }

  /* -------------------- HELPERS -------------------- */

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

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
