import {
  assertValidConnectorCredentials,
  getValidatedConnectorCredentials,
  validateConnectorCredentials,
} from './connector-credentials';

describe('connector credential validation', () => {
  it.each([
    [
      'amazon',
      {
        lwa_client_id: 'encrypted-client-id',
        lwa_client_secret: 'encrypted-client-secret',
        refresh_token: 'encrypted-refresh-token',
      },
    ],
    [
      'walmart',
      {
        WALMART_CLIENT_ID: 'encrypted-client-id',
        WALMART_CLIENT_SECRET: 'encrypted-client-secret',
      },
    ],
    [
      'shopify',
      {
        shopDomain: 'example.myshopify.com',
        accessToken: 'encrypted-token',
      },
    ],
    ['tiktok', {}],
    ['faire', { access_token: 'encrypted-access-token' }],
    [
      'target',
      {
        apiKey: 'encrypted-api-key',
        sellerId: 'encrypted-seller-id',
        sellerToken: 'encrypted-seller-token',
      },
    ],
    ['warehance', { WAREHANCE_API_KEY: 'encrypted-api-key' }],
  ] as const)('passes complete %s credentials', (platform, credentials) => {
    expect(validateConnectorCredentials(platform, credentials)).toEqual({
      valid: true,
      missing: [],
    });
  });

  it('returns all missing required fields', () => {
    expect(validateConnectorCredentials('amazon', {})).toEqual({
      valid: false,
      missing: ['lwa_client_id', 'lwa_client_secret', 'refresh_token'],
    });
  });

  it('throws before connector initialization when credentials are invalid', () => {
    expect(() => assertValidConnectorCredentials('walmart', {})).toThrow(
      'Invalid walmart credentials: missing WALMART_CLIENT_ID, WALMART_CLIENT_SECRET',
    );
  });

  it('returns typed credentials after validation', () => {
    const credentials = getValidatedConnectorCredentials('target', {
      apiKey: 'encrypted-api-key',
      sellerId: 'encrypted-seller-id',
      sellerToken: 'encrypted-seller-token',
      timeout: 1000,
    });

    expect(credentials.sellerToken).toBe('encrypted-seller-token');
    expect(credentials.timeout).toBe(1000);
  });
});
