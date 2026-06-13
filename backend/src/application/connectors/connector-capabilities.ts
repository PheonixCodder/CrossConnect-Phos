import {
  ConnectorDomain,
  ConnectorRateLimitProfile,
  PlatformCapabilityProfile,
  PlatformType,
} from './connector.types';

const DEFAULT_RATE_LIMIT: ConnectorRateLimitProfile = {
  maxRetries: 5,
  baseDelayMs: 500,
  maxDelayMs: 30000,
  jitterMs: 300,
  rateLimitStatuses: [429],
  retryableStatuses: [408, 425, 500, 502, 503, 504],
};

const SLOW_API_RATE_LIMIT: ConnectorRateLimitProfile = {
  ...DEFAULT_RATE_LIMIT,
  maxRetries: 8,
  baseDelayMs: 5000,
  maxDelayMs: 120000,
};

export const CONNECTOR_CAPABILITIES: Record<
  PlatformType,
  PlatformCapabilityProfile
> = {
  amazon: {
    platform: 'amazon',
    domains: ['products', 'orders', 'returns'],
    supportsOAuth: true,
    supportsWebhooks: false,
    cursorMode: 'provider',
    rateLimit: SLOW_API_RATE_LIMIT,
  },
  walmart: {
    platform: 'walmart',
    domains: ['products', 'orders', 'returns'],
    supportsOAuth: true,
    supportsWebhooks: true,
    cursorMode: 'domain',
    rateLimit: {
      ...DEFAULT_RATE_LIMIT,
      maxRetries: 6,
      baseDelayMs: 1000,
      maxDelayMs: 60000,
    },
  },
  shopify: {
    platform: 'shopify',
    domains: ['products', 'orders', 'returns'],
    supportsOAuth: true,
    supportsWebhooks: true,
    cursorMode: 'domain',
    rateLimit: SLOW_API_RATE_LIMIT,
  },
  tiktok: {
    platform: 'tiktok',
    domains: ['products', 'orders', 'returns'],
    supportsOAuth: true,
    supportsWebhooks: true,
    cursorMode: 'provider',
    rateLimit: SLOW_API_RATE_LIMIT,
  },
  faire: {
    platform: 'faire',
    domains: ['products', 'orders'],
    supportsOAuth: true,
    supportsWebhooks: false,
    cursorMode: 'domain',
    rateLimit: DEFAULT_RATE_LIMIT,
  },
  target: {
    platform: 'target',
    domains: ['products', 'orders', 'returns'],
    supportsOAuth: false,
    supportsWebhooks: false,
    cursorMode: 'domain',
    rateLimit: DEFAULT_RATE_LIMIT,
  },
  warehance: {
    platform: 'warehance',
    domains: ['products', 'orders'],
    supportsOAuth: false,
    supportsWebhooks: false,
    cursorMode: 'provider',
    rateLimit: DEFAULT_RATE_LIMIT,
  },
};

export function getConnectorCapability(
  platform: PlatformType,
): PlatformCapabilityProfile {
  return CONNECTOR_CAPABILITIES[platform];
}

export function connectorSupportsDomain(
  platform: PlatformType,
  domain: ConnectorDomain,
): boolean {
  return getConnectorCapability(platform).domains.includes(domain);
}
