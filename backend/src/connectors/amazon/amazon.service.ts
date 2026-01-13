import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SellingPartnerApiAuth } from '@sp-api-sdk/auth';
import { ReportsApiClient } from '@sp-api-sdk/reports-api-2021-06-30';
import { Order, OrderItem, OrdersApiClient } from '@sp-api-sdk/orders-api-v0';
import {
  FbaInventoryApiClient,
  InventorySummary,
} from '@sp-api-sdk/fba-inventory-api-v1';
import axios from 'axios';
import * as zlib from 'zlib';
import { AmazonMerchantListingRow } from './amazon.types';
import { Database } from 'src/supabase/supabase.types';

@Injectable()
export class AmazonService implements OnModuleInit {
  private readonly logger = new Logger(AmazonService.name);
  private auth: SellingPartnerApiAuth;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.auth = new SellingPartnerApiAuth({
      clientId: this.config.get<string>('LWA_CLIENT_ID')!,
      clientSecret: this.config.get('LWA_CLIENT_SECRET')!,
      refreshToken: this.config.get('LWA_REFRESH_TOKEN')!,
    });
  }

  // ------------------------------------------------------------------
  // PRODUCTS (Listings Report)
  // ------------------------------------------------------------------
  async getAllProducts(
    store: Database['public']['Tables']['stores']['Row'],
  ): Promise<AmazonMerchantListingRow[]> {
    const client = new ReportsApiClient({
      auth: this.auth,
      region: 'eu',
    });

    const { data } = await client.createReport({
      body: {
        reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
        marketplaceIds: [store.marketplaceId!],
      },
    });

    const reportId = data.reportId;
    let report;

    for (let i = 0; i < 15; i++) {
      await this.sleep(30_000);
      report = await client.getReport({ reportId });

      if (report.data.processingStatus === 'DONE') break;
      if (report.data.processingStatus === 'CANCELLED') {
        throw new Error('Listings report cancelled');
      }
    }

    if (report.data.processingStatus !== 'DONE') {
      throw new Error('Listings report timeout');
    }

    const doc = await client.getReportDocument({
      reportDocumentId: report.data.reportDocumentId!,
    });

    const raw = await axios.get(doc.data.url, {
      responseType: 'arraybuffer',
    });

    let buffer = Buffer.from(raw.data);

    if (doc.data.compressionAlgorithm === 'GZIP') {
      buffer = zlib.gunzipSync(buffer);
    }

    return this.parseTSV(buffer.toString('utf8'));
  }

  // ------------------------------------------------------------------
  // INVENTORY (FBA)
  // ------------------------------------------------------------------
  async getInventorySummaries(
    store: Database['public']['Tables']['stores']['Row'],
  ): Promise<InventorySummary[]> {
    const client = new FbaInventoryApiClient({
      auth: this.auth,
      region: 'eu',
    });

    const results: InventorySummary[] = [];
    let nextToken: string | undefined;

    do {
      const { data } = await client.getInventorySummaries({
        marketplaceIds: [store.marketplaceId!],
        granularityType: 'Marketplace',
        granularityId: store.marketplaceId!,
        nextToken,
      });

      results.push(...(data.payload!.inventorySummaries ?? []));
      nextToken = data.pagination?.nextToken;
    } while (nextToken);

    return results;
  }

  // ------------------------------------------------------------------
  // ORDERS
  // ------------------------------------------------------------------
  async getOrders(
    store: Database['public']['Tables']['stores']['Row'],
    createdAfter?: string,
  ): Promise<Order[]> {
    const client = new OrdersApiClient({
      auth: this.auth,
      region: 'eu',
    });

    const orders: Order[] = [];
    let nextToken: string | undefined;

    do {
      const { data } = await client.getOrders({
        marketplaceIds: [store.marketplaceId!],
        createdAfter,
        nextToken,
      });

      orders.push(...(data.payload?.Orders ?? []));
      nextToken = data.payload?.NextToken;
    } while (nextToken);

    return orders;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const client = new OrdersApiClient({
      auth: this.auth,
      region: 'eu',
    });

    const items: OrderItem[] = [];
    let nextToken: string | undefined;

    do {
      const { data } = await client.getOrderItems({
        orderId,
        nextToken,
      });

      items.push(...(data.payload?.OrderItems ?? []));
      nextToken = data.payload?.NextToken;
    } while (nextToken);

    return items;
  }

  // ------------------------------------------------------------------
  // RETURNS
  // ------------------------------------------------------------------
  async getReturns(
    store: Database['public']['Tables']['stores']['Row'],
    createdAfter: string,
  ) {}

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  private parseTSV(data: string) {
    const lines = data.trim().split(/\r?\n/);
    const headers = lines.shift()!.split('\t');

    return lines.map((line) => {
      const values = line.split('\t');
      const row: any = {};

      headers.forEach((h, i) => {
        row[h] = values[i] ?? null;
      });

      return row;
    });
  }
  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
