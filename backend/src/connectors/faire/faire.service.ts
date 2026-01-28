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

  private baseUrl: string;
  private accessToken: string;
  private timeout: number;

  /** Retry policy */
  private readonly maxRetries = 5;
  private readonly baseDelayMs = 500;

  constructor(private readonly http: HttpService) {}

  // -----------------------------
  // INITIALIZATION
  // -----------------------------
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

  // -----------------------------
  // RETRY + BACKOFF CORE
  // -----------------------------
  private async sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    params?: Record<string, unknown>,
    attempt = 0,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Faire service not initialized');
    }

    try {
      const response$ = this.http.request<T>({
        method,
        url: `${this.baseUrl}${path}`,
        headers: this.headers,
        params,
        timeout: this.timeout,
      });

      const { data } = await firstValueFrom(response$);
      return data;
    } catch (error: any) {
      const status = error?.response?.status;

      const shouldRetry =
        attempt < this.maxRetries &&
        (!status || status === 429 || status >= 500);

      if (!shouldRetry) {
        this.logger.error(
          `Faire API error ${method} ${path}`,
          error?.response?.data || error.message,
        );
        throw new InternalServerErrorException(
          'Failed to communicate with Faire API',
        );
      }

      const delay =
        this.baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250);

      this.logger.warn(
        `Retrying Faire API ${method} ${path} (attempt ${
          attempt + 1
        }) in ${delay}ms`,
      );

      await this.sleep(delay);
      return this.request<T>(method, path, params, attempt + 1);
    }
  }

  // -------------------------
  // ORDERS (FULL + DELTA)
  // -------------------------
  async getAllOrders(since?: string): Promise<getOrders['orders']> {
    const allOrders: getOrders['orders'] = [];
    let page = 1;
    const limit = 250;

    while (true) {
      const query = new URLSearchParams({
        limit: String(limit),
        page: String(page),
      });

      if (since) {
        query.append('updated_at_min', since);
      }

      const response = await this.request<getOrders>(
        'GET',
        `/orders?${query.toString()}`,
      );

      if (!response?.orders?.length) break;

      allOrders.push(...response.orders);

      if (response.orders.length < limit) break;
      page++;
    }

    return allOrders;
  }

  async getOrderById(orderId: string): Promise<any> {
    return this.request('GET', `/orders/${orderId}`);
  }

  // -------------------------
  // PRODUCTS (FULL + DELTA)
  // -------------------------
  async getAllProducts(since?: string): Promise<getProducts['products']> {
    const allProducts: getProducts['products'] = [];
    let page = 1;
    const limit = 250;

    while (true) {
      const query = new URLSearchParams({
        limit: String(limit),
        page: String(page),
      });

      if (since) {
        query.append('updated_at_min', since);
      }

      const response = await this.request<getProducts>(
        'GET',
        `/products?${query.toString()}`,
      );

      if (!response?.products?.length) break;

      allProducts.push(...response.products);

      if (response.products.length < limit) break;
      page++;
    }

    return allProducts;
  }

  // -------------------------
  // INVENTORY (BULK SAFE)
  // -------------------------
  async getInventory(
    products: Database['public']['Tables']['products']['Insert'][],
  ): Promise<GetInventory> {
    if (!products?.length) {
      return {};
    }

    const url = generateInventoryUrl(products);
    return this.request<GetInventory>('POST', url);
  }
}
