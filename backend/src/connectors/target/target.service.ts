import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  TargetFulfillment,
  TargetOrder,
  TargetProduct,
  TargetProductReturn,
} from './target.mapper';
import { TargetProductReturnsResponse } from './target.types';

@Injectable()
export class TargetService {
  private readonly logger = new Logger(TargetService.name);

  private baseUrl: string;
  private apiKey: string;
  private sellerId: string;
  private sellerToken: string;
  private timeout: number;

  /** Retry config */
  private readonly maxRetries = 5;
  private readonly baseDelayMs = 500;

  constructor(private readonly http: HttpService) {}

  // -------------------------------
  // INITIALIZATION
  // -------------------------------
  initialize(credentials: any): void {
    this.baseUrl = credentials.baseUrl || 'https://api.target.com';
    this.apiKey = credentials.apiKey;
    this.sellerId = credentials.sellerId;
    this.sellerToken = credentials.sellerToken;
    this.timeout = credentials.timeout || 30000;

    if (!this.apiKey || !this.sellerId || !this.sellerToken) {
      this.logger.error('Target credentials are missing');
      throw new Error('Target API key, sellerId, and sellerToken are required');
    }
  }

  private get headers() {
    return {
      'x-api-key': this.apiKey,
      'x-seller-id': this.sellerId,
      'x-seller-token': this.sellerToken,
      'Content-Type': 'application/json',
    };
  }

  // -------------------------------
  // RETRY + BACKOFF CORE
  // -------------------------------
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
      throw new Error('Target service not initialized');
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
          `Target API failed ${method} ${path}`,
          error?.response?.data || error.message,
        );
        throw new InternalServerErrorException(
          'Failed to communicate with Target API',
        );
      }

      const delay =
        this.baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250);

      this.logger.warn(
        `Retrying Target API ${method} ${path} (attempt ${
          attempt + 1
        }) in ${delay}ms`,
      );

      await this.sleep(delay);
      return this.request<T>(method, path, params, attempt + 1);
    }
  }

  // --------------------------------
  // PRODUCT CATALOG (DELTA SAFE)
  // --------------------------------
  async getProducts(options?: {
    afterId?: string;
    since?: string; // ISO 8601
    listingStatus?:
      | 'APPROVED'
      | 'PENDING'
      | 'REJECTED'
      | 'UNLISTED'
      | 'SUSPENDED';
    tcin?: string;
    externalId?: string;
    expand?: 'fields' | 'product_statuses';
    perPage?: number;
  }): Promise<TargetProduct[]> {
    return this.request<TargetProduct[]>(
      'GET',
      `/sellers/${this.sellerId}/products_catalog`,
      {
        after_id: options?.afterId,
        last_modified: options?.since,
        listing_status: options?.listingStatus,
        tcin: options?.tcin,
        external_id: options?.externalId,
        expand: options?.expand,
        per_page: options?.perPage ?? 200,
      },
    );
  }

  async getAllProducts(since?: string): Promise<TargetProduct[]> {
    const all: TargetProduct[] = [];
    let afterId: string | undefined;

    do {
      const batch = await this.getProducts({
        afterId,
        since,
        expand: 'fields',
        perPage: 200,
      });

      if (!batch?.length) break;

      all.push(...batch);
      afterId = batch.at(-1)?.id;
    } while (afterId);

    return all;
  }

  // --------------------------------
  // ORDERS (DELTA via order_date)
  // --------------------------------
  async getAllOrders(options?: {
    since?: string; // ISO 8601
    order_status?: string[];
    order_number?: string;
    tcin?: string;
    page?: number;
    per_page?: number;
  }): Promise<TargetOrder[]> {
    const all: TargetOrder[] = [];
    let page = options?.page ?? 1;
    const perPage = options?.per_page ?? 500;

    while (true) {
      const data = await this.request<TargetOrder[]>(
        'GET',
        `/sellers/${this.sellerId}/orders`,
        {
          order_date: options?.since,
          order_status: options?.order_status,
          order_number: options?.order_number,
          tcin: options?.tcin,
          page,
          per_page: perPage,
        },
      );

      if (!data?.length) break;

      all.push(...data);
      if (data.length < perPage) break;

      page++;
    }

    return all;
  }

  // --------------------------------
  // ORDER FULFILLMENTS
  // --------------------------------
  async getOrderFulfillments(orderId: string): Promise<TargetFulfillment[]> {
    if (!orderId) throw new Error('orderId is required');

    return (
      (await this.request<TargetFulfillment[]>(
        'GET',
        `/sellers/${this.sellerId}/orders/${orderId}/fulfillments`,
      )) ?? []
    );
  }

  // --------------------------------
  // PRODUCT RETURNS (DELTA SAFE)
  // --------------------------------
  async getAllProductReturns(options?: {
    since?: string; // ISO interval
    after_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<TargetProductReturn[]> {
    const all: TargetProductReturn[] = [];
    let afterId = options?.after_id;
    let page = options?.page ?? 1;
    const perPage = options?.per_page ?? 100;

    while (true) {
      const data = await this.request<TargetProductReturnsResponse>(
        'GET',
        `/sellers/${this.sellerId}/product_returns_search`,
        {
          return_date: options?.since,
          after_id: afterId,
          page,
          per_page: perPage,
        },
      );

      if (!data?.items?.length) break;

      all.push(...data.items);

      const last = data.items.at(-1);
      if (last?.id) {
        afterId = last.id;
      } else if (data.items.length < perPage) {
        break;
      } else {
        page++;
      }
    }

    return all;
  }
}
