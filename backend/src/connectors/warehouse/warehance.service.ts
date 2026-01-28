import warehanceApi, {
  ListProductsResponse200,
  ListOrdersResponse200,
  ListShipmentsResponse200,
} from '../../../.api/apis/warehance-api';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AlertsRepository } from '../../supabase/repositories/alerts.repository';

@Injectable()
export class WarehanceService {
  private readonly logger = new Logger(WarehanceService.name);
  private warehance: typeof warehanceApi;

  private apiKey: string;
  private tiktokStoreId: number;

  constructor(
    private readonly alertsRepo: AlertsRepository, // Inject here
  ) {}
  initialize(credentials: any): void {
    this.apiKey = credentials.WAREHANCE_API_KEY;
    this.tiktokStoreId = credentials.TIKTOK_STORE_ID;

    if (!this.apiKey) {
      this.logger.error('Warehance API key is missing');
      throw new Error('Warehance API key is required');
    }

    try {
      this.warehance = warehanceApi.auth(this.apiKey);
      this.logger.log('Warehance client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to init Warehance client', error);
      throw error;
    }
  }

  // ----------------------------------------------------------------
  // PRODUCTS (full fetch – used only for product mapping in orders)
  // ----------------------------------------------------------------
  async getProducts(): Promise<ListProductsResponse200['data']> {
    if (!this.warehance) throw new Error('Warehance not initialized');

    try {
      const allProducts: any[] = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const response = await this.retry(() =>
          this.warehance.listProducts({ limit, offset }),
        );

        const page = response.data?.data?.products ?? [];
        allProducts.push(...page);

        if (page.length < limit) break;
        offset += limit;
      }

      return { products: allProducts };
    } catch (error) {
      await this.alertsRepo.createAlert({
        alert_type: 'product_sync_failure',
        message: `Warehance products fetch failed: ${error.message}`,
        severity: 'high',
      });
      throw error;
    }
  }

  // ----------------------------------------------------------------
  // ORDERS – Now supports incremental sync with since date
  // ----------------------------------------------------------------
  async getOrders(since?: string): Promise<ListOrdersResponse200['data']> {
    if (!this.warehance) throw new Error('Warehance not initialized');

    try {
      const allOrders: any[] = [];
      let offset = 0;
      const limit = 100;
      const required_ship_date_start = since;
      const store_id = this.tiktokStoreId;

      while (true) {
        this.logger.debug(
          `Fetching orders: offset=${offset}, since=${since || 'full'}`,
        );

        const response = await this.retry(() =>
          this.warehance.listOrders({
            limit,
            offset,
            required_ship_date_start,
            store_id,
            // If Warehance API supports a 'since' or 'updated_after' param,
            // uncomment and adjust:
            // updated_after: since,
          }),
        );

        const page = response.data?.data?.orders ?? [];
        allOrders.push(...page);

        if (page.length < limit) break;
        offset += limit;
      }

      this.logger.log(
        `Fetched ${allOrders.length} orders (incremental: ${!!since})`,
      );
      return { orders: allOrders };
    } catch (error) {
      this.logger.error('Warehance orders fetch failed', error);
      await this.alertsRepo.createAlert({
        alert_type: 'order_fetch_failure',
        message: `Warehance orders fetch failed: ${error.message}`,
        severity: 'high',
      });
      throw error;
    }
  }

  // ----------------------------------------------------------------
  // SHIPMENTS – Now supports incremental sync with since date
  // ----------------------------------------------------------------
  async getShipments(
    since?: string,
  ): Promise<ListShipmentsResponse200['data']> {
    if (!this.warehance) throw new Error('Warehance not initialized');

    try {
      const allShipments: any[] = [];
      let offset = 0;
      const limit = 100;
      const required_ship_date_start = since;

      while (true) {
        this.logger.debug(
          `Fetching shipments: offset=${offset}, since=${since || 'full'}`,
        );

        const response = await this.retry(() =>
          this.warehance.listShipments({
            limit,
            offset,
            required_ship_date_start,
            // If API supports since/created_after, add here:
            // created_after: since,
          }),
        );

        const page = response.data?.data?.shipments ?? [];
        allShipments.push(...page);

        if (page.length < limit) break;
        offset += limit;
      }

      this.logger.log(`Fetched ${allShipments.length} shipments`);
      return { shipments: allShipments };
    } catch (error) {
      this.logger.error('Warehance shipments fetch failed', error);
      await this.alertsRepo.createAlert({
        alert_type: 'shipment_fetch_failure',
        message: `Warehance shipments fetch failed: ${error.message}`,
        severity: 'medium',
      });
      throw error;
    }
  }

  // ----------------------------------------------------------------
  // Retry helper with exponential backoff
  // ----------------------------------------------------------------
  private async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 4,
    baseDelay = 1000,
  ): Promise<T> {
    let attempt = 0;
    let delay = baseDelay;

    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        if (attempt >= maxRetries) throw err;

        const isRateLimit = err?.response?.status === 429;
        const wait = isRateLimit ? delay * 2 : delay;

        this.logger.warn(
          `Warehance API retry ${attempt}/${maxRetries} after ${wait}ms`,
          err.message,
        );

        await new Promise((r) => setTimeout(r, wait));
        delay *= 2;
      }
    }

    throw new Error('Max retries reached');
  }

  private handleError(method: string, error: any) {
    this.logger.error(`Warehance ${method} error`, error);
    throw new InternalServerErrorException(`Warehance ${method} failed`);
  }
}
