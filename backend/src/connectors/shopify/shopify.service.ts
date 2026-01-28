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
} from './operations';
import {
  FetchProductsQuery,
  FetchInventoryLevelsQuery,
  FetchOrdersQuery,
  FetchFulfillmentsQuery,
  FetchReturnsQuery,
} from './graphql/generated/admin.generated';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);
  private client: GraphQLClient;

  private shop: string;
  private accessToken: string;
  private apiVersion = '2026-01';

  /* -------------------- INIT -------------------- */

  initialize(credentials: any): void {
    this.shop = credentials.shopDomain;
    this.accessToken = credentials.accessToken;

    if (!this.shop || !this.accessToken) {
      throw new Error('Critical Shopify Configuration Missing');
    }

    this.client = new GraphQLClient(
      `https://${this.shop}.myshopify.com/admin/api/${this.apiVersion}/graphql.json`,
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
          err?.response?.status ?? err?.response?.statusCode ?? err?.statusCode;

        const isThrottle =
          err?.response?.errors?.some((e) =>
            String(e.message).toLowerCase().includes('throttle'),
          ) ?? false;

        const retryable = status === 429 || status >= 500 || isThrottle;

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

  private async execute<T>(
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
    const data = await this.execute<FetchOrdersQuery>(
      FETCH_ORDERS,
      {
        since, // updatedAt >= $since
      },
      'fetchOrders',
    );

    return data?.orders?.nodes || [];
  }

  /* -------------------- FULFILLMENTS (DELTA) -------------------- */

  async fetchFulfillments(
    since?: string,
  ): Promise<FetchFulfillmentsQuery['orders']['nodes']> {
    const data = await this.execute<FetchFulfillmentsQuery>(
      FETCH_FULFILLMENTS,
      {
        since, // fulfillment.updatedAt >= $since
      },
      'fetchFulfillments',
    );

    return data?.orders?.nodes || [];
  }

  /* -------------------- RETURNS (DELTA) -------------------- */

  async fetchReturns(
    since?: string,
  ): Promise<FetchReturnsQuery['orders']['edges']> {
    const data = await this.execute<FetchReturnsQuery>(
      FETCH_RETURNS,
      {
        since, // return.updatedAt >= $since
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
