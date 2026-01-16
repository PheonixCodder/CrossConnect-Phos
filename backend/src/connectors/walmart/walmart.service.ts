import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
export class WalmartService implements OnModuleInit {
  private readonly logger = new Logger(WalmartService.name);
  private walmart: typeof WalmartMarketplace;

  constructor(private readonly config: ConfigService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async onModuleInit() {
    try {
      this.walmart = new WalmartMarketplace({
        clientId: this.config.get<string>('WALMART_CLIENT_ID')!,
        clientSecret: this.config.get<string>('WALMART_CLIENT_SECRET')!,
        url: this.config.get<string>('WALMART_API_URL')!,
      });
    } catch (error) {
      this.logger.error('Failed to init Walmart client', error);
      throw error;
    }
  }
  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts(): Promise<WalmartItem[]> {
    try {
      const response = (await this.walmart.items.getAllItems({
        autoPagination: true,
        limit: 50,
      })) as GetAllItemsResponse;

      return Array.isArray(response.ItemResponse) ? response.ItemResponse : [];
    } catch (error) {
      this.handleError('getProducts', error);
      this.logger.error(
        'Walmart API error in getProducts',
        error?.response?.data || error.message,
      );

      throw error;
    }
  }

  // -------------------------
  // ORDERS
  // -------------------------
  async getOrders(): Promise<Order[]> {
    try {
      // Uses official getAllOrders method per package docs
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
    try {
      if (!product.sku) {
        throw new Error('SKU is required to fetch inventory');
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
  // Product Returns
  // -------------------------
  async getWalmartProductReturns(): Promise<ReturnOrder[]> {
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
