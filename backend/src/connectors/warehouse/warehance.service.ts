import warehanceApi, {
  ListProductsResponse200,
  ListOrdersResponse200,
  ListShipmentsResponse200,
} from '@api/warehance-api';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WarehanceService implements OnModuleInit {
  private readonly logger = new Logger(WarehanceService.name);
  private warehance: typeof warehanceApi;

  constructor(private readonly config: ConfigService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async onModuleInit() {
    try {
      this.warehance = warehanceApi.auth(
        this.config.get<string>('WAREHANCE_API_KEY')!,
      );
    } catch (error) {
      this.logger.error('Failed to init Warehance client', error);
      throw error;
    }
  }
  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts(): Promise<ListProductsResponse200['data']> {
    try {
      const response = await this.warehance.listProducts();

      return response.data.data;
    } catch (error) {
      this.handleError('getProducts', error);
    }
  }

  // -------------------------
  // ORDERS
  // -------------------------
  async getOrders(): Promise<ListOrdersResponse200['data']> {
    try {
      // Uses official getAllOrders method per package docs
      const orders = await this.warehance.listOrders();
      return orders.data.data;
    } catch (error) {
      this.handleError('getOrders', error);
      throw error;
    }
  }

  // -------------------------
  // Product Returns
  // -------------------------
  async getShipments(): Promise<ListShipmentsResponse200['shipments']> {
    try {
      // Uses official getAllOrders method per package docs
      const shipments = await this.warehance.listShipments();
      return shipments.data.shipments;
    } catch (error) {
      this.handleError('getOrders', error);
      throw error;
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
