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

  // Configuration properties to be set by PlatformServiceFactory
  private shop: string;
  private accessToken: string;
  private apiVersion = '2026-01';

  constructor() {}

  /**
   * Initialize service with credentials from PlatformServiceFactory
   */
  initialize(credentials: any): void {
    this.shop = credentials.shopDomain;
    this.accessToken = credentials.accessToken;

    if (!this.shop || !this.accessToken) {
      this.logger.error('Shopify credentials are missing');
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

  private async execute<T>(
    query: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    if (!this.client) {
      throw new Error(
        'Shopify service not initialized. Call initialize() first.',
      );
    }

    try {
      return await this.client.request<T>(query, variables);
    } catch (error: any) {
      this.logger.error(
        `Shopify GraphQL Request Failed: ${error.message}`,
        error.stack,
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

  async fetchProducts(): Promise<FetchProductsQuery['products']['nodes']> {
    const data = await this.execute<FetchProductsQuery>(FETCH_PRODUCTS);
    return data?.products?.nodes || [];
  }

  async fetchInventory(): Promise<
    FetchInventoryLevelsQuery['inventoryItems']['nodes']
  > {
    const data = await this.execute<FetchInventoryLevelsQuery>(
      FETCH_INVENTORY_LEVELS,
    );
    return data?.inventoryItems?.nodes || [];
  }

  async fetchOrders(): Promise<FetchOrdersQuery['orders']['nodes']> {
    const data = await this.execute<FetchOrdersQuery>(FETCH_ORDERS);
    return data?.orders?.nodes || [];
  }

  async fetchFulfillments(): Promise<
    FetchFulfillmentsQuery['orders']['nodes']
  > {
    const data = await this.execute<FetchFulfillmentsQuery>(FETCH_FULFILLMENTS);
    return data?.orders?.nodes || [];
  }

  async fetchReturns(): Promise<FetchReturnsQuery['orders']['edges']> {
    const data = await this.execute<FetchReturnsQuery>(FETCH_RETURNS);
    return data?.orders?.edges || [];
  }
}
