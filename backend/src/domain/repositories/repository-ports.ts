export type SyncCursorDomain = 'products' | 'orders' | 'returns';
export type PlatformType =
  | 'shopify'
  | 'faire'
  | 'amazon'
  | 'walmart'
  | 'tiktok'
  | 'warehance'
  | 'target';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface StoreRecord {
  id: string;
  org_id?: string | null;
  platform: PlatformType;
  webhook_status?: boolean | null;
  last_products_synced_at?: string | null;
  last_orders_synced_at?: string | null;
  last_returns_synced_at?: string | null;
  [key: string]: unknown;
}

export interface OrganizationRecord {
  id: string;
  created_by?: string | null;
  [key: string]: unknown;
}

export interface AlertInsertRecord {
  store_id: string | null;
  alert_type: string;
  message: string;
  severity: AlertSeverity;
  platform?: PlatformType | null;
  [key: string]: unknown;
}

export interface StoresAsQueuedResult {
  error: unknown | null;
}

export interface ActiveStoreCredentialsRecord {
  store: StoreRecord;
  credentials: unknown;
}

export interface StoresRepositoryPort {
  getAllActiveStores(): Promise<StoreRecord[]>;
  getStoreById(storeId: string): Promise<StoreRecord>;
  getOrgById(orgId: string): Promise<OrganizationRecord>;
  updateStoreHealth(
    storeId: string,
    status: 'healthy' | 'unhealthy',
    message?: string,
  ): Promise<void>;
  updateWebhookStatus(storeId: string, status: boolean): Promise<void>;
  storesAsQueued(storeIds: string[]): Promise<StoresAsQueuedResult>;
  updateSyncTimestamps(
    storeId: string,
    domain: SyncCursorDomain,
    syncedAt: string,
  ): Promise<void>;
}

export interface StoreCredentialsRepositoryPort {
  getActiveStoresWithCredentials(): Promise<ActiveStoreCredentialsRecord[]>;
  getCredentialsByStoreId(storeId: string): Promise<unknown>;
  updateCredentials(storeId: string, credentials: unknown): Promise<void>;
}

export interface AlertsRepositoryPort {
  createAlert(alert: AlertInsertRecord): Promise<void>;
}

export interface WebhookIngestRecord {
  provider: PlatformType;
  storeId: string;
  userId?: string;
  eventId: string;
  topic: string;
  payload: unknown;
  receivedAt?: string;
}

export interface PersistedWebhookRecord {
  rawEventId: string;
  duplicate: boolean;
}

export interface WebhookEventsRepositoryPort {
  persistRawEvent(event: WebhookIngestRecord): Promise<PersistedWebhookRecord>;
  getRawEventPayload(rawEventId: string): Promise<unknown | null>;
}

export interface ProductSkuIdRecord {
  id: string;
  sku: string;
}

export interface InventoryBatchResult {
  affected: number;
}

export interface StoreProductLookupRecord {
  id: string;
  external_product_id?: string | null;
  title?: string | null;
  sku?: string | null;
  asin?: string | null;
}

export interface ProductsRepositoryPort {
  insertProducts(products: any[]): Promise<any[]>;
  syncProductsAndInventory(
    products: any[],
    inventory: any[],
  ): Promise<{ error: unknown | null }>;
  getAllProductsByStore(storeId: string): Promise<StoreProductLookupRecord[]>;
  getIdsBySkus(
    storeId: string,
    skus: string[],
    platform: string,
  ): Promise<ProductSkuIdRecord[]>;
  getProductIdsByIdentifiers(
    storeId: string,
    platform: string,
    identifiers: {
      skus?: string[];
      externalProductIds?: string[];
      asins?: string[];
    },
  ): Promise<Map<string, string>>;
  getProductIdsBySkusInBatches(
    storeId: string,
    skus: string[],
    platform: string,
  ): Promise<Map<string, string>>;
}

export interface InventoryRepositoryPort {
  updateInventory(inventory: any, sku: string): Promise<void>;
  updateInventoryBatch(inventoryBatch: any[]): Promise<InventoryBatchResult>;
  getBySkus(skus: string[], storeId: string): Promise<Record<string, any>>;
}

export interface OrdersRepositoryPort {
  insertOrdersAndReturn(orders: any[]): Promise<{ data: any[] }>;
  syncOrderData(
    ordersPayload: any,
    itemsPayload: any,
    shipmentsPayload: any,
  ): Promise<unknown>;
  getByExternalOrderIds(
    storeId: string,
    externalOrderIds: string[],
  ): Promise<any[]>;
}

export interface OrderItemsRepositoryPort {
  bulkUpsertOrderItems(items: any[]): Promise<{ count: number }>;
}

export interface FulfillmentsRepositoryPort {
  insertShipments(
    shipments: any[],
  ): Promise<{ data: any[]; error: unknown | null }>;
}

export interface MetricsRepositoryPort {
  bulkUpsertMetrics(items: any[]): Promise<{ count: number }>;
}

export interface ReturnsRepositoryPort {
  insertReturns(
    returns: any[],
  ): Promise<{ data: unknown[] | null; error: unknown }>;
}

export const STORES_REPOSITORY = Symbol('STORES_REPOSITORY');
export const STORE_CREDENTIALS_REPOSITORY = Symbol(
  'STORE_CREDENTIALS_REPOSITORY',
);
export const ALERTS_REPOSITORY = Symbol('ALERTS_REPOSITORY');
export const WEBHOOK_EVENTS_REPOSITORY = Symbol('WEBHOOK_EVENTS_REPOSITORY');
export const PRODUCTS_REPOSITORY = Symbol('PRODUCTS_REPOSITORY');
export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');
export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');
export const ORDER_ITEMS_REPOSITORY = Symbol('ORDER_ITEMS_REPOSITORY');
export const FULFILLMENTS_REPOSITORY = Symbol('FULFILLMENTS_REPOSITORY');
export const METRICS_REPOSITORY = Symbol('METRICS_REPOSITORY');
export const RETURNS_REPOSITORY = Symbol('RETURNS_REPOSITORY');
