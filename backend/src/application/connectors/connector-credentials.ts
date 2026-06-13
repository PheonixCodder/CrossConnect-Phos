import {
  ConnectorCredentialsByPlatform,
  CredentialValidationResult,
  PlatformType,
} from './connector.types';

type CredentialPayload = Record<string, unknown>;

const REQUIRED_CREDENTIAL_FIELDS: Record<PlatformType, string[]> = {
  amazon: ['lwa_client_id', 'lwa_client_secret', 'refresh_token'],
  walmart: ['WALMART_CLIENT_ID', 'WALMART_CLIENT_SECRET'],
  shopify: ['shopDomain', 'accessToken'],
  tiktok: [],
  faire: ['access_token'],
  target: ['apiKey', 'sellerId', 'sellerToken'],
  warehance: ['WAREHANCE_API_KEY'],
};

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

export function validateConnectorCredentials(
  platform: PlatformType,
  credentials: unknown,
): CredentialValidationResult {
  const payload =
    credentials && typeof credentials === 'object'
      ? (credentials as CredentialPayload)
      : {};

  const missing = REQUIRED_CREDENTIAL_FIELDS[platform].filter(
    (field) => !isPresent(payload[field]),
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function assertValidConnectorCredentials(
  platform: PlatformType,
  credentials: unknown,
): asserts credentials is ConnectorCredentialsByPlatform[typeof platform] {
  const result = validateConnectorCredentials(platform, credentials);

  if (!result.valid) {
    throw new Error(
      `Invalid ${platform} credentials: missing ${result.missing.join(', ')}`,
    );
  }
}

export function getValidatedConnectorCredentials<
  TPlatform extends PlatformType,
>(
  platform: TPlatform,
  credentials: unknown,
): ConnectorCredentialsByPlatform[TPlatform] {
  assertValidConnectorCredentials(platform, credentials);

  return credentials as ConnectorCredentialsByPlatform[TPlatform];
}
