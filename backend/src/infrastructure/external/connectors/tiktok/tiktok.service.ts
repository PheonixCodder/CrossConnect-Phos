import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import {
  Analytics202405GetShopPerformanceResponseDataPerformanceIntervals,
  ClientConfiguration,
  Fulfillment202309SearchPackageResponseDataPackages,
  Order202309GetOrderListResponseDataOrders,
  Product202309InventorySearchResponseDataInventory,
  Product202502SearchProductsResponseDataProducts,
  ReturnRefund202309SearchReturnsResponseDataReturnOrders,
  TikTokShopNodeApiClient,
} from '../../../../libs/tiktok';
import { TikTokOAuthService } from '../oauth/tiktok-oauth.service';

@Injectable()
export class TikTokService {
  private client: TikTokShopNodeApiClient;
  private readonly logger = new Logger(TikTokService.name);

  constructor(
    private config: ConfigService,
    private oauth: TikTokOAuthService,
  ) {}

  initialize(): void {
    ClientConfiguration.globalConfig.app_key =
      this.config.get('TIKTOK_APP_KEY');
    ClientConfiguration.globalConfig.app_secret =
      this.config.get('TIKTOK_APP_SECRET');

    this.client = new TikTokShopNodeApiClient({
      config: ClientConfiguration.createConfig().build(),
    });
  }

  /* -------------------- RETRY + BACKOFF -------------------- */

  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string,
    maxRetries = 8,
    baseDelayMs = 5000,
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;

        const status =
          err?.response?.status ?? err?.response?.statusCode ?? err?.statusCode;

        const isNetworkError =
          err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

        if (err.body) {
          this.logger.error(
            `TikTok API Error Body: ${JSON.stringify(err.body)}`,
          );
        }

        const retryable =
          isNetworkError || status === 429 || (status >= 500 && status < 600);

        if (!retryable || attempt > maxRetries) {
          this.logger.error(
            `TikTok API failed [${context}] after ${attempt} attempts`,
            err?.stack ?? err,
          );
          throw err;
        }

        const backoff =
          baseDelayMs * Math.pow(2, attempt - 1) +
          Math.floor(Math.random() * 300);

        this.logger.warn(
          `TikTok API retry ${attempt}/${maxRetries} [${context}] in ${backoff}ms`,
        );

        await this.sleep(backoff);
      }
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /* -------------------- ORDERS -------------------- */

  async getAllOrders(
    storeId: string,
    since?: number,
  ): Promise<Order202309GetOrderListResponseDataOrders[]> {
    const { accessToken, shop_cipher } =
      await this.oauth.getValidToken(storeId);

    const allOrders: Order202309GetOrderListResponseDataOrders[] = [];
    let pageToken = '';

    do {
      const res = await this.withRetry(
        () =>
          this.client.api.OrderV202309Api.OrdersSearchPost(
            100,
            accessToken,
            'application/json',
            undefined,
            pageToken || undefined,
            undefined,
            shop_cipher,
            { createTimeGe: since },
          ),
        'OrdersSearchPost',
      );

      const data = res.body.data;
      if (data?.orders) allOrders.push(...data.orders);
      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allOrders;
  }

  /* -------------------- PRODUCTS -------------------- */

  async getAllProducts(
    storeId: string,
  ): Promise<Product202502SearchProductsResponseDataProducts[] | []> {
    const { accessToken, shop_cipher } =
      await this.oauth.getValidToken(storeId);

    const allProducts: Product202502SearchProductsResponseDataProducts[] = [];
    let pageToken = '';

    do {
      const res = await this.withRetry(
        () =>
          this.client.api.ProductV202502Api.ProductsSearchPost(
            100,
            accessToken,
            'application/json',
            pageToken || undefined,
            shop_cipher,
          ),
        'ProductsSearchPost',
      );

      const data = res.body.data;
      if (data?.products) allProducts.push(...data.products);
      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allProducts ?? [];
  }

  /* -------------------- INVENTORY -------------------- */

  async getProductInventories(
    storeId: string,
    orderIds: string[],
  ): Promise<Product202309InventorySearchResponseDataInventory[]> {
    const { accessToken, shop_cipher } =
      await this.oauth.getValidToken(storeId);

    const res = await this.withRetry(
      () =>
        this.client.api.ProductV202309Api.InventorySearchPost(
          accessToken,
          'application/json',
          shop_cipher,
          { productIds: orderIds },
        ),
      'InventorySearchPost',
    );

    return res.body.data?.inventory || [];
  }

  /* -------------------- RETURNS -------------------- */

  async getAllReturns(
    storeId: string,
    since?: number,
  ): Promise<ReturnRefund202309SearchReturnsResponseDataReturnOrders[]> {
    const { accessToken, shop_cipher } =
      await this.oauth.getValidToken(storeId);

    const allReturns: ReturnRefund202309SearchReturnsResponseDataReturnOrders[] =
      [];
    let pageToken = '';

    do {
      const res = await this.withRetry(
        () =>
          this.client.api.ReturnRefundV202309Api.ReturnsSearchPost(
            accessToken,
            'application/json',
            undefined,
            undefined,
            '50',
            pageToken || undefined,
            shop_cipher,
            { createTimeGe: since },
          ),
        'ReturnsSearchPost',
      );

      const data = res.body.data;
      if (data?.returnOrders) {
        allReturns.push(...data.returnOrders);
      }

      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allReturns;
  }

  /* -------------------- FULFILLMENTS -------------------- */

  async getAllFulfillments(
    storeId: string,
    since?: number,
  ): Promise<Fulfillment202309SearchPackageResponseDataPackages[]> {
    const { accessToken, shop_cipher } =
      await this.oauth.getValidToken(storeId);

    const allPackages: Fulfillment202309SearchPackageResponseDataPackages[] =
      [];
    let pageToken = '';

    do {
      const res = await this.withRetry(
        () =>
          this.client.api.FulfillmentV202309Api.PackagesSearchPost(
            50,
            accessToken,
            'application/json',
            undefined,
            undefined,
            pageToken || undefined,
            shop_cipher,
            { createTimeGe: since },
          ),
        'PackagesSearchPost',
      );

      const data = res.body.data;

      if (data?.packages) {
        allPackages.push(...data.packages);
      }

      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allPackages;
  }

  async getDailyGMV(
    storeId: string,
    since?: number | Date,
  ): Promise<
    Analytics202405GetShopPerformanceResponseDataPerformanceIntervals[]
  > {
    const { accessToken, shop_cipher } =
      await this.oauth.getValidToken(storeId);

    const allIntervals: Analytics202405GetShopPerformanceResponseDataPerformanceIntervals[] =
      [];

    // Determine Start Date: use 'since' if provided, otherwise Jan 1st
    let currentStart: Date;
    if (since) {
      currentStart = new Date(since);
    } else {
      currentStart = new Date(new Date().getFullYear(), 0, 1);
    }

    const today = new Date();

    while (currentStart < today) {
      // Use 7-day windows for reliability
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 7);

      // end_date_lt is exclusive. To include "today", query up to "tomorrow".
      if (currentEnd > today) {
        currentEnd = new Date(today);
        currentEnd.setDate(currentEnd.getDate() + 1);
      }

      const startDateGe = currentStart.toISOString().split('T')[0];
      const endDateLt = currentEnd.toISOString().split('T')[0];

      const res = await this.withRetry(
        () =>
          this.client.api.AnalyticsV202405Api.ShopPerformanceGet(
            startDateGe,
            endDateLt,
            shop_cipher,
            accessToken,
            'application/json',
            false, // withComparison
            '1D', // granularity
            'LOCAL', // currency
          ),
        `ShopPerformanceGet [${startDateGe} to ${endDateLt}]`,
      );

      const performance = res.body.data?.performance;
      if (performance?.intervals) {
        allIntervals.push(...performance.intervals);
      }

      // Progress the loop: next start is the current exclusive end
      currentStart = new Date(currentEnd);

      // Respect rate limits
      await this.sleep(1000);
    }

    return allIntervals;
  }
}
