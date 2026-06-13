import { Database } from '../../infrastructure/persistence/supabase/supabase.types';

export type PlatformType = Database['public']['Enums']['platform_types'];
export type ConnectorDomain = 'products' | 'orders' | 'returns';

export interface ConnectorRateLimitProfile {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
  rateLimitStatuses: number[];
  retryableStatuses: number[];
}

export interface PlatformCapabilityProfile {
  platform: PlatformType;
  domains: ConnectorDomain[];
  supportsOAuth: boolean;
  supportsWebhooks: boolean;
  cursorMode: 'global' | 'domain' | 'provider';
  rateLimit: ConnectorRateLimitProfile;
}

export interface CredentialValidationResult {
  valid: boolean;
  missing: string[];
}

export interface AmazonCredentials {
  lwa_client_id: string;
  lwa_client_secret: string;
  refresh_token: string;
}

export interface WalmartCredentials {
  WALMART_CLIENT_ID: string;
  WALMART_CLIENT_SECRET: string;
  url?: string;
}

export interface ShopifyCredentials {
  shopDomain: string;
  accessToken: string;
}

export interface TikTokCredentials {
  [key: string]: unknown;
}

export interface FaireCredentials {
  access_token: string;
  baseUrl?: string;
  timeout?: number;
}

export interface TargetCredentials {
  apiKey: string;
  sellerId: string;
  sellerToken: string;
  baseUrl?: string;
  timeout?: number;
}

export interface WarehanceCredentials {
  WAREHANCE_API_KEY: string;
  TIKTOK_STORE_ID?: number;
}

export interface ConnectorCredentialsByPlatform {
  amazon: AmazonCredentials;
  walmart: WalmartCredentials;
  shopify: ShopifyCredentials;
  tiktok: TikTokCredentials;
  faire: FaireCredentials;
  target: TargetCredentials;
  warehance: WarehanceCredentials;
}

export type ConnectorCredentials = ConnectorCredentialsByPlatform[PlatformType];
