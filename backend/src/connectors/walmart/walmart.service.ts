import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import WalmartMarketplace from '@mediocre/walmart-marketplace';
import {
  WalmartItem,
  Order,
  GetInventoryResponse,
  ReturnOrder,
  WalmartItemsResponse,
  WalmartOrdersResponse,
  isGetAllItemsResponse,
  isGetAllOrdersResponse,
  isWalmartItemArray,
  GetAllItemsResponse,
  GetAllOrdersResponse,
} from './walmart.types';
import { Database } from 'src/supabase/supabase.types';
import * as crypto from 'crypto';

@Injectable()
export class WalmartService {
  private readonly logger = new Logger(WalmartService.name);
  private walmart: typeof WalmartMarketplace;

  private clientId: string;
  private clientSecret: string;
  private url: string;
  private readonly HISTORICAL_YEARS_BACK = 5; // Go back 5 years for historical sync

  constructor() {}

  initialize(credentials: any): void {
    this.clientId = credentials.WALMART_CLIENT_ID;
    this.clientSecret = credentials.WALMART_CLIENT_SECRET;
    this.url = credentials.url || 'https://marketplace.walmartapis.com';

    if (!this.clientId || !this.clientSecret) {
      this.logger.error('Walmart credentials are missing');
      throw new Error('Walmart clientId and clientSecret are required');
    }

    try {
      this.walmart = new WalmartMarketplace({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        url: this.url,
      });
      this.logger.log('Walmart client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to init Walmart client', error);
      throw error;
    }
  }

  // ────────────────────────────────────────────────
  // PRODUCTS – Safe typed implementation
  // ────────────────────────────────────────────────
  async getProducts(): Promise<WalmartItem[]> {
    if (!this.walmart) throw new Error('Walmart not initialized');

    try {
      this.logger.debug('Fetching Walmart products with autoPagination');

      // Use autoPagination to get all products
      const response: WalmartItemsResponse = await this.retry(() =>
        this.walmart.items.getAllItems({
          autoPagination: true, // This returns an array directly
          limit: 100, // Max items per page
        }),
      );

      // Handle different response formats
      let products: WalmartItem[] = [];

      if (isWalmartItemArray(response)) {
        // SDK returns array directly with autoPagination=true
        products = response;
      } else if (isGetAllItemsResponse(response)) {
        // SDK returns GetAllItemsResponse structure
        products = response.ItemResponse || [];
      } else {
        // Fallback for any other format
        this.logger.warn(
          'Unexpected products response format',
          typeof response,
        );
        products = Array.isArray(response) ? response : [];
      }

      this.logger.log(`Fetched ${products.length} products`);
      return products;
    } catch (error) {
      this.handleError('getProducts', error);
      throw error;
    }
  }

  // ────────────────────────────────────────────────
  // ORDERS – Get all orders from past 5 years
  // ────────────────────────────────────────────────
  async getOrders(since?: string): Promise<Order[]> {
    if (!this.walmart) throw new Error('Walmart not initialized');

    try {
      const params: any = {
        limit: 200, // Max allowed by Walmart
        autoPagination: true,
      };

      // Handle incremental vs full sync
      if (!since) {
        // Incremental sync: use lastModifiedStartDate to get updated orders
        params.lastModifiedStartDate = since;
        this.logger.debug(`Incremental orders sync since: ${since}`);
      } else {
        // FULL SYNC: Get all orders from past 5 years
        // Walmart API maximum date range is 30 days, so we need to fetch in chunks
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(
          fiveYearsAgo.getFullYear() - this.HISTORICAL_YEARS_BACK,
        );

        this.logger.log(
          `Full historical sync: fetching orders from past ${this.HISTORICAL_YEARS_BACK} years (since ${fiveYearsAgo.toISOString()})`,
        );

        // Use chunked approach for full historical sync
        return await this.getOrdersChunked(fiveYearsAgo);
      }

      this.logger.debug(
        `Fetching orders with params: ${JSON.stringify(params)}`,
      );

      const response: WalmartOrdersResponse = await this.retry(() =>
        this.walmart.orders.getAllOrders(params),
      );

      let orders: Order[] = [];

      if (Array.isArray(response)) {
        orders = response;
      } else if (isGetAllOrdersResponse(response)) {
        orders = response.list?.elements?.order || [];
      } else {
        this.logger.warn('Unexpected orders response format', typeof response);
        orders = [];
      }

      this.logger.log(
        `Fetched ${orders.length} orders (incremental: ${!!since})`,
      );
      return orders;
    } catch (error) {
      this.logger.error('Walmart orders fetch failed', error);

      // If error suggests date range is too wide, try chunked approach
      if (
        error.message?.includes('date range') ||
        error.message?.includes('too wide') ||
        error.message?.includes('createdStartDate')
      ) {
        this.logger.warn('Date range too wide, trying chunked approach');
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(
          fiveYearsAgo.getFullYear() - this.HISTORICAL_YEARS_BACK,
        );
        return await this.getOrdersChunked(fiveYearsAgo);
      }

      if (
        error.message?.includes('No orders found') ||
        error.message?.includes('empty response')
      ) {
        this.logger.log('No orders found, returning empty array');
        return [];
      }

      throw error;
    }
  }

  // ────────────────────────────────────────────────
  // CHUNKED ORDERS FETCH for full historical sync
  // ────────────────────────────────────────────────
  private async getOrdersChunked(startDate: Date): Promise<Order[]> {
    if (!this.walmart) throw new Error('Walmart not initialized');

    const allOrders: Order[] = [];

    // Determine date range (past 5 years to now)
    const endDate = new Date();

    this.logger.log(
      `Fetching orders in chunks from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Walmart limits date ranges to 30 days max per call
    const chunkSizeDays = 30;
    let currentStart = new Date(startDate);
    let chunkNumber = 1;

    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + chunkSizeDays);
      if (currentEnd > endDate) {
        currentEnd.setTime(endDate.getTime());
      }

      this.logger.debug(
        `Fetching chunk ${chunkNumber}: ${currentStart.toISOString()} to ${currentEnd.toISOString()}`,
      );

      try {
        const params: any = {
          limit: 200,
          autoPagination: true,
          createdStartDate: currentStart.toISOString(),
          createdEndDate: currentEnd.toISOString(),
        };

        const response: WalmartOrdersResponse = await this.retry(() =>
          this.walmart.orders.getAllOrders(params),
        );

        let chunkOrders: Order[] = [];

        if (Array.isArray(response)) {
          chunkOrders = response;
        } else if (isGetAllOrdersResponse(response)) {
          chunkOrders = response.list?.elements?.order || [];
        }

        allOrders.push(...chunkOrders);
        this.logger.debug(
          `Fetched ${chunkOrders.length} orders for chunk ${chunkNumber}`,
        );

        // Move to next chunk
        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1); // Add 1 day to avoid overlap

        // Small delay between chunks to avoid rate limiting
        if (currentStart < endDate) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        chunkNumber++;
      } catch (chunkError) {
        this.logger.error(
          `Failed to fetch chunk ${currentStart.toISOString()} - ${currentEnd.toISOString()}`,
          chunkError,
        );
        // Continue with next chunk instead of failing entirely
        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
        chunkNumber++;
      }
    }

    // Deduplicate orders (just in case of any overlap)
    const uniqueOrders = this.deduplicateOrders(allOrders);
    this.logger.log(
      `Total fetched ${uniqueOrders.length} unique orders from ${chunkNumber - 1} chunks`,
    );
    return uniqueOrders;
  }

  // ────────────────────────────────────────────────
  // Deduplicate orders by purchaseOrderId
  // ────────────────────────────────────────────────
  private deduplicateOrders(orders: Order[]): Order[] {
    const orderMap = new Map<string, Order>();

    for (const order of orders) {
      if (order.purchaseOrderId) {
        orderMap.set(order.purchaseOrderId, order);
      }
    }

    return Array.from(orderMap.values());
  }

  // ────────────────────────────────────────────────
  // INVENTORY – Safe typed implementation
  // ────────────────────────────────────────────────
  async getInventory(
    product: Database['public']['Tables']['products']['Insert'] | WalmartItem,
  ): Promise<GetInventoryResponse | null> {
    if (!this.walmart) throw new Error('Walmart not initialized');

    try {
      const sku = product.sku;

      if (!sku) {
        this.logger.warn('SKU is required to fetch Walmart inventory');
        return null;
      }

      const inventory: GetInventoryResponse = await this.retry(() =>
        this.walmart.inventory.getInventory(sku),
      );

      return inventory;
    } catch (error) {
      this.logger.warn(`Failed to fetch inventory for SKU: ${error.message}`);
      return null;
    }
  }

  // ────────────────────────────────────────────────
  // RETURNS – Get returns from past 5 years
  // ────────────────────────────────────────────────
  async getWalmartProductReturns(
    since?: string,
  ): Promise<ReturnOrder[] | null> {
    if (!this.walmart) throw new Error('Walmart not initialized');

    try {
      const token = await this.walmart.authentication.getAccessToken();

      const params = new URLSearchParams();
      params.append('limit', '100');

      if (since) {
        params.append('createdStartDate', since);
        this.logger.debug(`Incremental returns sync since: ${since}`);
      } else {
        // FULL SYNC: Get returns from past 5 years
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(
          fiveYearsAgo.getFullYear() - this.HISTORICAL_YEARS_BACK,
        );
        params.append('createdStartDate', fiveYearsAgo.toISOString());
        this.logger.log(
          `Full historical returns sync: fetching from past ${this.HISTORICAL_YEARS_BACK} years (since ${fiveYearsAgo.toISOString()})`,
        );
      }

      const correlationId = crypto.randomUUID();

      const headers: Record<string, string> = {
        'WM_SEC.ACCESS_TOKEN': token.access_token,
        'WM_SVC.NAME': 'Walmart Marketplace',
        WM_MARKET: 'us',
        WM_GLOBAL_VERSION: '3.1',
        'WM_QOS.CORRELATION_ID': correlationId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      this.logger.debug(
        `Fetching returns with correlation ID: ${correlationId}`,
      );

      const response = await fetch(
        `${this.url}/v3/returns?${params.toString()}`,
        {
          method: 'GET',
          headers,
        },
      );

      this.logger.debug(
        `Returns API response status: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(
          `Returns API error: ${response.status} - ${errorText}`,
        );

        if ([404, 403, 401].includes(response.status)) {
          this.logger.warn(
            `Returns API not available (status: ${response.status})`,
          );
          return null;
        }

        // If it's a date range error, try chunked approach
        if (response.status === 400 && errorText.includes('date')) {
          this.logger.warn(
            'Date range too wide for returns, trying chunked approach',
          );
          const fiveYearsAgo = new Date();
          fiveYearsAgo.setFullYear(
            fiveYearsAgo.getFullYear() - this.HISTORICAL_YEARS_BACK,
          );
          return await this.getReturnsChunked(fiveYearsAgo);
        }

        throw new Error(
          `Returns API failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data.returnOrders || [];
    } catch (error) {
      this.logger.error('Walmart returns fetch failed', error);

      // If it's a network error or timeout, try chunked approach
      if (
        error.name === 'TypeError' ||
        error.message.includes('fetch') ||
        error.message.includes('network')
      ) {
        this.logger.warn('Network error for returns, trying chunked approach');
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(
          fiveYearsAgo.getFullYear() - this.HISTORICAL_YEARS_BACK,
        );
        return await this.getReturnsChunked(fiveYearsAgo);
      }

      return null;
    }
  }

  // ────────────────────────────────────────────────
  // CHUNKED RETURNS FETCH for full historical sync
  // ────────────────────────────────────────────────
  private async getReturnsChunked(
    startDate: Date,
  ): Promise<ReturnOrder[] | null> {
    if (!this.walmart) throw new Error('Walmart not initialized');

    const allReturns: ReturnOrder[] = [];

    const endDate = new Date();
    const chunkSizeDays = 30;
    let currentStart = new Date(startDate);
    let chunkNumber = 1;

    this.logger.log(
      `Fetching returns in chunks from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + chunkSizeDays);
      if (currentEnd > endDate) {
        currentEnd.setTime(endDate.getTime());
      }

      this.logger.debug(
        `Fetching returns chunk ${chunkNumber}: ${currentStart.toISOString()} to ${currentEnd.toISOString()}`,
      );

      try {
        const token = await this.walmart.authentication.getAccessToken();

        const params = new URLSearchParams();
        params.append('limit', '100');
        params.append('createdStartDate', currentStart.toISOString());
        params.append('createdEndDate', currentEnd.toISOString());

        const correlationId = crypto.randomUUID();

        const headers: Record<string, string> = {
          'WM_SEC.ACCESS_TOKEN': token.access_token,
          'WM_SVC.NAME': 'Walmart Marketplace',
          WM_MARKET: 'us',
          WM_GLOBAL_VERSION: '3.1',
          'WM_QOS.CORRELATION_ID': correlationId,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        };

        const response = await fetch(
          `${this.url}/v3/returns?${params.toString()}`,
          {
            method: 'GET',
            headers,
          },
        );

        if (response.ok) {
          const data = await response.json();
          const chunkReturns = data.returnOrders || [];
          allReturns.push(...chunkReturns);
          this.logger.debug(
            `Fetched ${chunkReturns.length} returns for chunk ${chunkNumber}`,
          );
        } else if ([404, 403, 401].includes(response.status)) {
          this.logger.warn(
            `Returns API not available for chunk ${chunkNumber} (status: ${response.status})`,
          );
          // Continue with next chunk
        } else {
          this.logger.warn(
            `Failed to fetch returns chunk ${chunkNumber}: ${response.status}`,
          );
        }

        // Move to next chunk
        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1); // Add 1 day to avoid overlap

        // Small delay between chunks to avoid rate limiting
        if (currentStart < endDate) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        chunkNumber++;
      } catch (chunkError) {
        this.logger.error(
          `Failed to fetch returns chunk ${chunkNumber}`,
          chunkError,
        );
        // Continue with next chunk
        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
        chunkNumber++;
      }
    }

    // Deduplicate returns
    const uniqueReturns = this.deduplicateReturns(allReturns);
    this.logger.log(
      `Total fetched ${uniqueReturns.length} unique returns from ${chunkNumber - 1} chunks`,
    );
    return uniqueReturns;
  }

  // ────────────────────────────────────────────────
  // Deduplicate returns by returnOrderId
  // ────────────────────────────────────────────────
  private deduplicateReturns(returns: ReturnOrder[]): ReturnOrder[] {
    const returnMap = new Map<string, ReturnOrder>();

    for (const returnOrder of returns) {
      if (returnOrder.returnOrderId) {
        returnMap.set(returnOrder.returnOrderId, returnOrder);
      }
    }

    return Array.from(returnMap.values());
  }

  // ────────────────────────────────────────────────
  // Retry helper – Type-safe with proper error handling
  // ────────────────────────────────────────────────
  private async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    baseDelay = 2000,
  ): Promise<T> {
    let attempt = 0;
    let delay = baseDelay;

    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;

        // Check for rate limiting
        const isRateLimit =
          err?.cause?.status === 429 ||
          err?.response?.status === 429 ||
          err?.message?.includes('Too Many Requests') ||
          err?.message?.includes('Rate Limit');

        // Calculate wait time with jitter
        let wait = isRateLimit ? delay * 2 : delay;
        wait += Math.random() * 1000; // Jitter

        this.logger.warn(
          `Walmart API retry ${attempt}/${maxRetries} after ${Math.round(wait)}ms` +
            (isRateLimit ? ' (rate limit detected)' : ''),
          err.message || err,
        );

        // Wait before retrying
        await new Promise((r) => setTimeout(r, wait));
        delay *= 2; // Exponential backoff

        if (attempt >= maxRetries) {
          this.logger.error(`Max retries reached for Walmart API call`, err);
          throw err;
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Max retries reached');
  }

  // ────────────────────────────────────────────────
  // Error handler
  // ────────────────────────────────────────────────
  private handleError(method: string, error: any): never {
    const status = error?.cause?.status || error?.response?.status;
    const apiMessage = error?.message || error?.cause?.message;

    this.logger.error(`Walmart ${method} error`, {
      status,
      apiMessage,
      fullError: error,
    });

    throw new InternalServerErrorException(
      `Walmart API failed: ${method} (${status || 'unknown'} - ${apiMessage || 'no details'})`,
    );
  }
}
