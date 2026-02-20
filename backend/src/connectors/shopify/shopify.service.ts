import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import {
  FETCH_PRODUCTS,
  FETCH_INVENTORY_LEVELS,
  FETCH_FULFILLMENTS,
  FETCH_ORDERS,
  FETCH_RETURNS,
  FETCH_DAILY_METRICS,
} from './operations';
import {
  FetchProductsQuery,
  FetchInventoryLevelsQuery,
  FetchOrdersQuery,
  FetchFulfillmentsQuery,
  FetchReturnsQuery,
  ShopifyDailySalesMetricsQuery,
} from './graphql/generated/admin.generated';
import { CryptoService } from '../../common/crypto.service';

export type SalesTableData = NonNullable<
  NonNullable<ShopifyDailySalesMetricsQuery['shopifyqlQuery']>['tableData']
>;
@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);
  private client: GraphQLClient;

  private shop: string;
  private accessToken: string;
  private apiVersion = '2026-01';
  constructor(private crypto: CryptoService) {}

  /* -------------------- INIT -------------------- */

  initialize(credentials: any): void {
    this.shop = this.crypto.decrypt(credentials.shopDomain);
    this.accessToken = this.crypto.decrypt(credentials.accessToken);

    if (!this.shop || !this.accessToken) {
      throw new Error('Critical Shopify Configuration Missing');
    }

    this.client = new GraphQLClient(
      `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`,
      {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
        },
      },
    );
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

        const isThrottle =
          err?.response?.errors?.some((e) =>
            String(e.message).toLowerCase().includes('throttle'),
          ) ?? false;
        const isNetworkError =
          err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

        const retryable =
          isNetworkError || status === 429 || status >= 500 || isThrottle;

        if (!retryable || attempt > maxRetries) {
          this.logger.error(
            `Shopify API failed [${context}] after ${attempt} attempts`,
            err?.stack ?? err,
          );
          throw err;
        }

        const backoff =
          baseDelayMs * Math.pow(2, attempt - 1) +
          Math.floor(Math.random() * 300);

        this.logger.warn(
          `Shopify retry ${attempt}/${maxRetries} [${context}] in ${backoff}ms`,
        );

        await this.sleep(backoff);
      }
    }
  }

  /* -------------------- EXECUTOR -------------------- */

  async execute<T>(
    query: string,
    variables?: Record<string, any>,
    context = 'graphql',
  ): Promise<T> {
    if (!this.client) {
      throw new Error(
        'Shopify service not initialized. Call initialize() first.',
      );
    }

    try {
      return await this.withRetry(
        () => this.client.request<T>(query, variables),
        context,
      );
    } catch (error: any) {
      this.logger.error(
        `Shopify GraphQL Request Failed`,
        error?.stack ?? error,
      );

      if (error.response?.errors) {
        this.logger.error(
          'GraphQL Errors:',
          JSON.stringify(error.response.errors),
        );
      }

      throw new InternalServerErrorException(
        'Shopify API Communication Failure',
      );
    }
  }

  async fetchDailyMetrics(since?: string): Promise<SalesTableData | null> {
    let timeClause: string;

    if (since) {
      const formattedSince = since.split('T')[0];
      timeClause = `SINCE ${formattedSince} UNTIL today`;
    } else {
      // Replaced DURING with SINCE/UNTIL to avoid IDENTIFIER mismatch
      timeClause = `SINCE 2026-01-01 UNTIL 2026-02-18`;
    }

    // Added 'BY day' before TIMESERIES
    const shopifyql = `
  FROM sales 
  SHOW gross_sales, orders, total_sales 
  ${timeClause} 
  TIMESERIES day 
  ORDER BY day ASC
`
      .replace(/\s+/g, ' ')
      .trim();

    const data = await this.execute<ShopifyDailySalesMetricsQuery>(
      FETCH_DAILY_METRICS,
      { shopifyql },
      'fetchDailyMetrics',
    );

    if (data.shopifyqlQuery?.parseErrors?.length) {
      this.logger.error(
        `ShopifyQL parse errors: ${JSON.stringify(data.shopifyqlQuery?.parseErrors)}`,
      );
      throw new Error('ShopifyQL query parse error');
    }

    return data.shopifyqlQuery?.tableData ?? null;
  }

  /* -------------------- PRODUCTS (SNAPSHOT) -------------------- */

  async fetchProducts(): Promise<FetchProductsQuery['products']['nodes']> {
    const data = await this.execute<FetchProductsQuery>(
      FETCH_PRODUCTS,
      undefined,
      'fetchProducts',
    );

    return data?.products?.nodes || [];
  }

  /* -------------------- INVENTORY (DELTA) -------------------- */

  async fetchInventory(
    since?: string,
  ): Promise<FetchInventoryLevelsQuery['inventoryItems']['nodes']> {
    const data = await this.execute<FetchInventoryLevelsQuery>(
      FETCH_INVENTORY_LEVELS,
      {
        since, // must be used in query as updatedAt >= $since
      },
      'fetchInventory',
    );

    return data?.inventoryItems?.nodes || [];
  }

  /* -------------------- ORDERS (DELTA) -------------------- */

  async fetchOrders(
    since?: string,
  ): Promise<FetchOrdersQuery['orders']['nodes']> {
    const filter = since ? `updated_at:>='${since}'` : '';
    const data = await this.execute<FetchOrdersQuery>(
      FETCH_ORDERS,
      {
        since: filter,
      },
      'fetchOrders',
    );

    return data?.orders?.nodes || [];
  }

  /* -------------------- FULFILLMENTS (DELTA) -------------------- */

  async fetchFulfillments(
    since?: string,
  ): Promise<FetchFulfillmentsQuery['orders']['nodes']> {
    const filter = since ? `updated_at:>='${since}'` : '';

    const data = await this.execute<FetchFulfillmentsQuery>(
      FETCH_FULFILLMENTS,
      {
        since: filter,
      },
      'fetchFulfillments',
    );

    return data?.orders?.nodes || [];
  }

  /* -------------------- RETURNS (DELTA) -------------------- */

  async fetchReturns(
    since?: string,
  ): Promise<FetchReturnsQuery['orders']['edges']> {
    const filter = since ? `updated_at:>='${since}'` : '';

    const data = await this.execute<FetchReturnsQuery>(
      FETCH_RETURNS,
      {
        since: filter,
      },
      'fetchReturns',
    );

    return data?.orders?.edges || [];
  }

  /* -------------------- HELPERS -------------------- */

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
