import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GetInventory, getOrders, getProducts } from './faire.types';
import { Database } from 'src/supabase/supabase.types';
import { generateInventoryUrl } from './faire.mapper';

@Injectable()
export class FaireService {
  private readonly logger = new Logger(FaireService.name);
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly timeout: number;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('faire.baseUrl')!;
    this.accessToken = this.config.get<string>('faire.accessToken')!;
    this.timeout = this.config.get<number>('faire.timeout')!;
  }

  private get headers() {
    return {
      'X-FAIRE-ACCESS-TOKEN': this.accessToken,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
  ): Promise<T> {
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
  getOrders() {
    return this.request<getOrders>('GET', '/orders');
  }

  getOrderById(orderId: string) {
    return this.request('GET', `/orders/${orderId}`);
  }

  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts() {
    return this.request<getProducts>('GET', '/products?limit=250');
  }

  // -------------------------
  // INVENTORY
  // -------------------------
  getInventory(products: Database['public']['Tables']['products']['Insert'][]) {
    const url = generateInventoryUrl(products);
    return this.request<GetInventory>('POST', url);
  }
}
