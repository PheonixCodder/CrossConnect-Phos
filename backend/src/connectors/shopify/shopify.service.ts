import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { ConfigService } from '@nestjs/config';
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
export class ShopifyService implements OnModuleInit {
  private readonly logger = new Logger(ShopifyService.name);
  private client: GraphQLClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const shop = this.configService.get<string>('SHOPIFY_STORE');
    const token = this.configService.get<string>('SHOPIFY_ACCESS_TOKEN');

    if (!shop || !token) {
      this.logger.error(
        'SHOPIFY_STORE or SHOPIFY_ACCESS_TOKEN is missing in environment',
      );
      throw new Error('Critical Configuration Missing');
    }

    this.client = new GraphQLClient(`https://${shop}://`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });
  }

  private async execute<T>(
    query: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    try {
      return await this.client.request<T>(query, variables);
    } catch (error: any) {
      this.logger.error(
        `GraphQL Request Failed: ${error.message}`,
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
