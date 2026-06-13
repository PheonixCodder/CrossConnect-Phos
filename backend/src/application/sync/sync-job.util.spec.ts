import {
  buildSyncJobId,
  buildSyncJobPayload,
  getSyncJobName,
  getSyncSince,
  isReturnsSupported,
} from './sync-job.util';
import { StoreRow } from './sync.types';

const store = {
  id: 'store-1',
  org_id: 'org-1',
  platform: 'shopify',
  last_products_synced_at: '2026-06-01T10:00:00.000Z',
  last_orders_synced_at: '2026-06-02T10:00:00.000Z',
  last_returns_synced_at: null,
} as StoreRow;

describe('sync-job.util', () => {
  it('selects the domain-specific cursor', () => {
    expect(getSyncSince(store, 'products')).toBe('2026-06-01T10:00:00.000Z');
    expect(getSyncSince(store, 'orders')).toBe('2026-06-02T10:00:00.000Z');
    expect(getSyncSince(store, 'returns')).toBeUndefined();
  });

  it('builds deterministic job ids', () => {
    expect(buildSyncJobId('products', 'store-1', 'cursor')).toBe(
      'sync-products-store-1-cursor',
    );
    expect(
      buildSyncJobId('products', 'store-1', '2026-06-01T10:00:00.000Z'),
    ).toBe('sync-products-store-1-2026-06-01T10-00-00.000Z');
    expect(buildSyncJobId('returns', 'store-1')).toBe(
      'sync-returns-store-1-initial',
    );
  });

  it('builds metadata-only scheduled payloads', () => {
    const payload = buildSyncJobPayload(store, 'products');

    expect(payload).toMatchObject({
      storeId: 'store-1',
      platform: 'shopify',
      orgId: 'org-1',
      domain: 'products',
      since: '2026-06-01T10:00:00.000Z',
      reason: 'scheduled',
    });
    expect(payload).not.toHaveProperty('credentials');
    expect(payload.enqueuedAt).toBeDefined();
  });

  it('builds the existing platform-domain job name', () => {
    expect(getSyncJobName(buildSyncJobPayload(store, 'orders'))).toBe(
      'shopify.orders',
    );
  });

  it('keeps returns support limited to existing platforms', () => {
    expect(isReturnsSupported('amazon')).toBe(true);
    expect(isReturnsSupported('walmart')).toBe(true);
    expect(isReturnsSupported('shopify')).toBe(true);
    expect(isReturnsSupported('target')).toBe(true);
    expect(isReturnsSupported('faire')).toBe(false);
    expect(isReturnsSupported('tiktok')).toBe(false);
    expect(isReturnsSupported('warehance')).toBe(false);
  });
});

