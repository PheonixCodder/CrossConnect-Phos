import { Database } from '../../infrastructure/persistence/supabase/supabase.types';

export type WebhookProvider = Extract<
  Database['public']['Enums']['platform_types'],
  'shopify' | 'walmart' | 'tiktok'
>;

export interface WebhookIngestPayload {
  provider: WebhookProvider;
  storeId: string;
  userId?: string;
  eventId: string;
  topic: string;
  payload: unknown;
  receivedAt?: string;
}

export interface WebhookJobPayload {
  rawEventId: string;
  provider: WebhookProvider;
  storeId: string;
  userId?: string;
  eventId: string;
  topic: string;
  reason: 'webhook';
}

export interface PersistedWebhookEvent {
  rawEventId: string;
  duplicate: boolean;
}
