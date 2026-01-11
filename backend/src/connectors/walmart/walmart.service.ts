import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WalmartApi,
  OrdersApi,
  ItemsApi,
  InventoryApi,
  ReturnsRefundsApi,
  defaultParams,
} from '@whitebox-co/walmart-marketplace-api';
import { InlineResponse2003ItemResponse } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/items';
import { InlineResponse200 } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/inventory';
import { Database } from 'src/supabase/supabase.types';
import { InlineResponse2002 } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/returns';
import { InlineResponse2001 } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/orders';

@Injectable()
export class WalmartService implements OnModuleInit {
  private readonly logger = new Logger(WalmartService.name);
  private walmart: WalmartApi;

  constructor(private readonly config: ConfigService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async onModuleInit() {
    this.walmart = new WalmartApi({
      clientId: this.config.get<string>('WALMART_CLIENT_ID')!,
      clientSecret: this.config.get<string>('WALMART_CLIENT_SECRET')!,
      // consumerChannelType is optional but often required for certain reports
    });
  }

  // -------------------------
  // ORDERS
  // -------------------------
  async getOrders(): Promise<InlineResponse2001 | undefined> {
    try {
      const ordersApi = await this.walmart.getConfiguredApi(OrdersApi);
      // Fetches created orders by default; adjust parameters for specific statuses
      const response = await ordersApi.getAllOrders({
        ...defaultParams,
        createdStartDate: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // Last 7 days
      });
      return response.data;
    } catch (error) {
      this.handleError('getOrders', error);
    }
  }

  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts(): Promise<InlineResponse2003ItemResponse[] | undefined> {
    try {
      const itemsApi = await this.walmart.getConfiguredApi(ItemsApi);

      const allItems: InlineResponse2003ItemResponse[] = [];
      let nextCursor: string | undefined;
      let retries = 0;
      const maxRetries = 3;

      do {
        try {
          const response = await itemsApi.getAllItems({
            ...defaultParams,
            limit: '50',
            ...(nextCursor ? { nextCursor } : {}),
          });

          const items = response.data?.ItemResponse ?? [];
          allItems.push(...items);

          nextCursor = response.data?.nextCursor;
          retries = 0; // reset retries after a successful call
        } catch (err: any) {
          const status = err?.response?.status;

          // Simple backoff on rate limiting
          if (status === 429 && retries < maxRetries) {
            retries++;
            const backoffMs = 500 * Math.pow(2, retries);
            await new Promise((res) => setTimeout(res, backoffMs));
            continue;
          }

          throw err;
        }
      } while (nextCursor);

      return allItems;
    } catch (error) {
      this.handleError('getProducts', error);
    }
  }
  // -------------------------
  // INVENTORY
  // -------------------------
  async getInventory(
    product: Database['public']['Tables']['products']['Insert'],
  ): Promise<InlineResponse200 | undefined> {
    try {
      const inventoryApi = await this.walmart.getConfiguredApi(InventoryApi);

      const response = await inventoryApi.getInventory({
        ...defaultParams,
        sku: product.sku, // Assumes your DB has a 'sku' field
      });
      return response.data;
    } catch (error) {
      this.handleError('getInventory', error);
    }
  }

  // -------------------------
  // Product Returns
  // -------------------------
  async getWalmartProductReturns(): Promise<InlineResponse2002 | undefined> {
    try {
      const returnsApi = await this.walmart.getConfiguredApi(ReturnsRefundsApi);

      const response = await returnsApi.getReturns({
        ...defaultParams,
      });
      return response.data;
    } catch (error) {
      this.handleError('getWalmartProductReturns', error);
    }
  }

  private handleError(method: string, error: any) {
    this.logger.error(
      `Walmart API error in ${method}`,
      error?.response?.data || error.message,
    );
    throw new InternalServerErrorException(
      `Failed to communicate with Walmart API: ${method}`,
    );
  }
}
