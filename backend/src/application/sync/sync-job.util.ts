import { SyncDomain, SyncJobPayload, SyncJobReason, StoreRow } from './sync.types';

const domainCursorFields: Record<SyncDomain, keyof StoreRow> = {
  products: 'last_products_synced_at',
  orders: 'last_orders_synced_at',
  returns: 'last_returns_synced_at',
};

export function getSyncSince(store: StoreRow, domain: SyncDomain): string | undefined {
  const value = store[domainCursorFields[domain]];
  return value ? new Date(value as string).toISOString() : undefined;
}

function encodeBullMqJobIdSegment(value: string): string {
  return value.replace(/:/g, '-');
}

export function buildSyncJobId(
  domain: SyncDomain,
  storeId: string,
  since?: string,
): string {
  const sinceKey = since ? encodeBullMqJobIdSegment(since) : 'initial';
  return `sync-${domain}-${storeId}-${sinceKey}`;
}

export function buildSyncJobPayload(
  store: StoreRow,
  domain: SyncDomain,
  reason: SyncJobReason = 'scheduled',
): SyncJobPayload {
  return {
    storeId: store.id,
    platform: store.platform,
    orgId: store.org_id || 'unknown',
    domain,
    since: getSyncSince(store, domain),
    enqueuedAt: new Date().toISOString(),
    reason,
  };
}

export function getSyncJobName(payload: SyncJobPayload): string {
  return `${payload.platform}.${payload.domain}`;
}

export function isReturnsSupported(platform: StoreRow['platform']): boolean {
  return ['amazon', 'walmart', 'shopify', 'target'].includes(platform);
}

