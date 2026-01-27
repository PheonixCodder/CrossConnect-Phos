import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GetInventory, getOrders, getProducts } from './faire.types';
import { Database } from '../../supabase/supabase.types';
import { generateInventoryUrl } from './faire.mapper';

@Injectable()
export class FaireService {
  private readonly logger = new Logger(FaireService.name);

  // Configuration properties to be set by PlatformServiceFactory
  private baseUrl: string;
  private accessToken: string;
  private timeout: number;

  constructor(private readonly http: HttpService) {}

  /**
   * Initialize service with credentials from PlatformServiceFactory
   */
  initialize(credentials: any): void {
    this.baseUrl = credentials.baseUrl || 'https://www.faire.com/api/v2';
    this.accessToken = credentials.access_token;
    this.timeout = credentials.timeout || 30000;

    if (!this.accessToken) {
      throw new Error('Faire OAuth access token missing');
    }
  }

  private get headers() {
    return {
      'X-FAIRE-APP-CREDENTIALS': Buffer.from(
        `${process.env.FAIRE_APP_ID}:${process.env.FAIRE_APP_SECRET}`,
      ).toString('base64'),
      'X-FAIRE-OAUTH-ACCESS-TOKEN': this.accessToken,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error(
        'Faire service not initialized. Call initialize() first.',
      );
    }

    try {
      const response$ = this.http.request<T>({
        method,
        url: `${this.baseUrl}${path}`,
        headers: this.headers,
        data,
        timeout: this.timeout,
      });

      const { data: responseData } = await firstValueFrom(response$);
      return responseData;
    } catch (error) {
      this.logger.error(
        `Faire API error on ${method} ${path}`,
        error?.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to communicate with Faire API',
      );
    }
  }

  // -------------------------
  // ORDERS
  // -------------------------
  async getOrders(): Promise<getOrders> {
    return this.request<getOrders>('GET', '/orders');
  }

  async getOrderById(orderId: string): Promise<any> {
    return this.request('GET', `/orders/${orderId}`);
  }

  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts(): Promise<getProducts> {
    return this.request<getProducts>('GET', '/products?limit=250');
  }

  // -------------------------
  // INVENTORY
  // -------------------------
  async getInventory(
    products: Database['public']['Tables']['products']['Insert'][],
  ) {
    const url = generateInventoryUrl(products);
    return this.request<GetInventory>('POST', url);
  }
}
