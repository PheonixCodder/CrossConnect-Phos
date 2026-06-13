import { Database } from '../../infrastructure/persistence/supabase/supabase.types';

export type SyncDomain = 'products' | 'orders' | 'returns';

export type SyncJobReason = 'scheduled' | 'manual' | 'webhook';

export type PlatformType = Database['public']['Enums']['platform_types'];

export type StoreRow = Database['public']['Tables']['stores']['Row'];

export interface SyncJobPayload {
  storeId: string;
  platform: PlatformType;
  orgId: string;
  domain: SyncDomain;
  since?: string;
  enqueuedAt: string;
  reason: SyncJobReason;
}

export interface SyncContext {
  payload: SyncJobPayload;
  store: StoreRow;
  credentials: unknown;
}

