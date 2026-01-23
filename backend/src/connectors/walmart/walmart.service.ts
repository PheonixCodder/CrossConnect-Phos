import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import WalmartMarketplace from '@mediocre/walmart-marketplace';
import {
  GetAllItemsResponse,
  GetInventoryResponse,
  Order,
  ReturnOrder,
  WalmartItem,
  WalmartReturnsResponse,
} from './walmart.types';
import { Database } from 'src/supabase/supabase.types';

@Injectable()
export class WalmartService {
  private readonly logger = new Logger(WalmartService.name);
  private walmart: any;

  // Configuration properties to be set by PlatformServiceFactory
  private clientId: string;
  private clientSecret: string;
  private url: string;

  constructor() {}

  /**
   * Initialize service with credentials from PlatformServiceFactory
   */
  initialize(credentials: any): void {
    this.clientId = credentials.WALMART_CLIENT_ID;
    this.clientSecret = credentials.WALMART_CLIENT_SECRET;
    this.url = credentials.url || 'https://marketplace.walmartapis.com';

    if (!this.clientId || !this.clientSecret) {
      this.logger.error('Walmart credentials are missing');
      throw new Error('Walmart clientId and clientSecret are required');
    }

    console.log(credentials);

    try {
      this.walmart = new WalmartMarketplace({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        url: this.url,
      });
      console.log('Walmart client created successfully');
      // Optional quick test
      // await this.walmart.orders.getAllOrders({ limit: 1 }); // or any cheap call
    } catch (error) {
      this.logger.error('Failed to init Walmart client', error);
      throw error;
    }
  }

  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts(): Promise<WalmartItem[]> {
    if (!this.walmart) {
      throw new Error(
        'Walmart service not initialized. Call initialize() first.',
      );
    }

    try {
      const response = (await this.walmart.items.getAllItems({
        autoPagination: true,
        limit: 50,
      })) as GetAllItemsResponse;

      return Array.isArray(response.ItemResponse) ? response.ItemResponse : [];
    } catch (error) {
      this.handleError('getProducts', error);
      throw error;
    }
  }

  // -------------------------
  // ORDERS
  // -------------------------
  async getOrders(): Promise<Order[]> {
    if (!this.walmart) {
      throw new Error(
        'Walmart service not initialized. Call initialize() first.',
      );
    }

    try {
      const orders = await this.walmart.orders.getAllOrders({
        createdStartDate: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      this.handleError('getOrders', error);
      throw error;
    }
  }

  // -------------------------
  // INVENTORY
  // -------------------------
  async getInventory(
    product: Database['public']['Tables']['products']['Insert'],
  ): Promise<GetInventoryResponse | null> {
    if (!this.walmart) {
      throw new Error(
        'Walmart service not initialized. Call initialize() first.',
      );
    }

    try {
      if (!product.sku) {
        throw new Error('SKU is required to fetch Walmart inventory');
      }

      const inventory = (await this.walmart.inventory.getInventory(
        product.sku,
      )) as GetInventoryResponse;

      return inventory;
    } catch (error) {
      this.handleError('getInventory', error);
      return null;
    }
  }

  // -------------------------
  // PRODUCT RETURNS
  // -------------------------
  async getWalmartProductReturns(): Promise<ReturnOrder[]> {
    if (!this.walmart) {
      throw new Error(
        'Walmart service not initialized. Call initialize() first.',
      );
    }

    try {
      const allReturns: ReturnOrder[] = [];
      let nextCursor: string | undefined;

      do {
        const response = (await this.walmart.returns.getReturns({
          ...(nextCursor ? { nextCursor } : {}),
        })) as WalmartReturnsResponse;

        if (Array.isArray(response.returnOrders)) {
          allReturns.push(...response.returnOrders);
        }

        nextCursor = response.meta?.nextCursor;
      } while (nextCursor);

      return allReturns;
    } catch (error) {
      this.handleError('getWalmartProductReturns', error);
      return [];
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
