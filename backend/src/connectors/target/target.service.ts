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

  // Configuration properties to be set by PlatformServiceFactory
  private baseUrl: string;
  private apiKey: string;
  private sellerId: string;
  private sellerToken: string;
  private timeout: number;

  constructor(private readonly http: HttpService) {}

  /**
   * Initialize service with credentials from PlatformServiceFactory
   */
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

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error(
        'Target service not initialized. Call initialize() first.',
      );
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
    } catch (error) {
      this.logger.error(
        `Target API error on ${method} ${path}`,
        error?.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to communicate with Target API',
      );
    }
  }

  // --------------------------------
  // PRODUCT CATALOG
  // --------------------------------
  async getProducts(options?: {
    afterId?: string;
    lastModified?: string;
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
        last_modified: options?.lastModified,
        listing_status: options?.listingStatus,
        tcin: options?.tcin,
        external_id: options?.externalId,
        expand: options?.expand,
        per_page: options?.perPage ?? 200,
      },
    );
  }

  async getAllProducts(): Promise<TargetProduct[]> {
    const allProducts: TargetProduct[] = [];
    let afterId: string | undefined;

    do {
      const batch = await this.getProducts({
        afterId,
        perPage: 200,
        expand: 'fields',
      });

      if (!batch?.length) break;

      allProducts.push(...batch);
      afterId = batch.at(-1)?.id;
    } while (afterId);

    return allProducts;
  }

  // --------------------------------
  // GET ORDERS
  // --------------------------------
  async getAllOrders(options?: {
    q?: string;
    order_status?: string[];
    ship_advice_number?: string;
    order_number?: string;
    tcin?: string;
    order_date?: string;
    requested_shipment_date?: string;
    ship_node_id?: string;
    page?: number;
    per_page?: number;
    sort?: string;
  }): Promise<TargetOrder[]> {
    const allOrders: TargetOrder[] = [];
    let page = options?.page ?? 1;
    const perPage = options?.per_page ?? 1000;

    while (true) {
      const params = {
        ...options,
        page,
        per_page: perPage,
      };

      const data = await this.request<TargetOrder[]>(
        'GET',
        `/sellers/${this.sellerId}/orders`,
        params,
      );

      if (!data?.length) break;

      allOrders.push(...data);
      if (data.length < perPage) break; // last page
      page++;
    }

    return allOrders;
  }

  // --------------------------------
  // GET ORDER FULFILLMENTS
  // --------------------------------
  async getOrderFulfillments(orderId: string): Promise<TargetFulfillment[]> {
    if (!orderId) throw new Error('orderId is required');

    const data = await this.request<TargetFulfillment[]>(
      'GET',
      `/sellers/${this.sellerId}/orders/${orderId}/fulfillments`,
    );

    return data ?? [];
  }

  // --------------------------------
  // PRODUCT RETURNS
  // --------------------------------
  async getAllProductReturns(options?: {
    order_id?: string;
    order_number?: string;
    return_order_number?: string;
    tcin?: string;
    license_plate?: string;
    tracking_number?: string;
    bill_of_lading?: string;
    receiving_location_id?: string;
    return_date?: string; // ISO 8601 interval
    is_online?: string;
    location_id?: string;
    after_id?: string;
    page?: number;
    per_page?: number;
    sort?: string;
  }): Promise<TargetProductReturn[]> {
    const allReturns: TargetProductReturn[] = [];
    let afterId = options?.after_id;
    let page = options?.page ?? 1;
    const perPage = options?.per_page ?? 100;

    while (true) {
      const params = {
        ...options,
        after_id: afterId,
        page,
        per_page: perPage,
      };

      const data = await this.request<TargetProductReturnsResponse>(
        'GET',
        `/sellers/${this.sellerId}/product_returns_search`,
        params,
      );

      if (!data?.items.length) break;

      allReturns.push(...data.items);

      /**
       * Prefer after_id pagination for large datasets.
       * Fallback to page-based pagination if after_id is not returned.
       */
      const lastItem = data.items.at(-1);
      if (lastItem?.id) {
        afterId = lastItem.id;
      } else if (data.items.length < perPage) {
        break;
      } else {
        page++;
      }
    }

    return allReturns;
  }
}
