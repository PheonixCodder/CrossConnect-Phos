import { parseStringPromise } from 'xml2js';
import { Injectable, Logger } from '@nestjs/common';
import { SellingPartnerApiAuth } from '@sp-api-sdk/auth';
import { ReportsApiClient } from '@sp-api-sdk/reports-api-2021-06-30';
import { Order, OrderItem, OrdersApiClient } from '@sp-api-sdk/orders-api-v0';
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

@Injectable()
export class AmazonService {
  private readonly logger = new Logger(AmazonService.name);
  private auth: SellingPartnerApiAuth;

  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private region = 'us-east-1';

  /* -------------------- INIT -------------------- */

  initialize(credentials: any): void {
    this.clientId = credentials.lwa_client_id;
    this.clientSecret = credentials.lwa_client_secret;
    this.refreshToken = credentials.refresh_token;

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
    maxRetries = 5,
    baseDelayMs = 1000,
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

  /* -------------------- ORDERS (DELTA) -------------------- */

  async getOrders(
    store: Database['public']['Tables']['stores']['Row'],
    since?: string,
  ): Promise<Order[]> {
    const client = new OrdersApiClient({
      auth: this.auth,
      region: this.region as SellingPartnerRegion,
    });

    const orders: Order[] = [];
    let nextToken: string | undefined;

    do {
      const { data } = await this.withRetry(
        () =>
          client.getOrders({
            marketplaceIds: [store.marketplaceId!],
            lastUpdatedAfter: since,
            nextToken,
          }),
        'getOrders',
      );

      orders.push(...((data.payload?.Orders as Order[]) ?? []));
      nextToken = data.payload?.NextToken;
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

    const { data } = await this.withRetry(
      () =>
        client.createReport({
          body: {
            reportType: 'GET_XML_RETURNS_DATA_BY_RETURN_DATE',
            marketplaceIds: [store.marketplaceId!],
          },
        }),
      'createReturnsReport',
    );

    const reportId = data.reportId;
    let report;

    for (let i = 0; i < 15; i++) {
      await this.sleep(30_000);

      report = await this.withRetry(
        () => client.getReport({ reportId }),
        'getReturnsReportStatus',
      );

      if (report.data.processingStatus === 'DONE') break;
      if (report.data.processingStatus === 'CANCELLED') {
        throw new Error('Returns report cancelled');
      }
    }

    if (report.data.processingStatus !== 'DONE') {
      throw new Error('Returns report timeout');
    }

    const doc = await this.withRetry(
      () =>
        client.getReportDocument({
          reportDocumentId: report.data.reportDocumentId!,
        }),
      'getReturnsReportDocument',
    );

    const raw = await axios.get(doc.data.url as string, {
      responseType: 'arraybuffer',
    });

    let buffer = Buffer.from(raw.data);
    if (doc.data.compressionAlgorithm === 'GZIP') {
      buffer = zlib.gunzipSync(buffer);
    }

    const parsed = await this.parseReturnsXml(buffer.toString('utf8'));

    if (!since) return parsed;

    return parsed.filter(
      (r) => new Date(r.return_request_date) > new Date(since),
    );
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

  private async parseReturnsXml(
    xml: string,
  ): Promise<AmazonReturnReportItem[]> {
    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: true,
    });

    const rows =
      parsed?.AmazonEnvelope?.Message?.ReturnDetails ??
      parsed?.AmazonEnvelope?.Message ??
      [];

    const normalized = Array.isArray(rows) ? rows : [rows];

    return normalized.map((r) => ({
      item_name: r.ItemName,
      asin: r.ASIN,
      merchant_sku: r.MerchantSKU,
      order_id: r.OrderID,
      order_date: r.OrderDate,
      amazon_rma_id: r.AmazonRMAID,
      return_request_date: r.ReturnRequestDate,
      return_request_status: r.ReturnRequestStatus,
      return_reason_code: r.ReturnReasonCode,
      return_quantity: Number(r.ReturnQuantity ?? 0),
      resolution: r.Resolution,
      refund_amount: Number(r.RefundAmount ?? 0),
      currency_code: r.CurrencyCode,
      in_policy: r.InPolicy === 'true',
      a_to_z_claim: r.AToZClaim === 'true',
      is_prime: r.IsPrime === 'true',
      return_type: r.ReturnType,
    }));
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
