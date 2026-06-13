import {
  CONNECTOR_CAPABILITIES,
  connectorSupportsDomain,
  getConnectorCapability,
} from './connector-capabilities';
import { PlatformType } from './connector.types';

describe('connector capabilities', () => {
  const platforms: PlatformType[] = [
    'amazon',
    'faire',
    'shopify',
    'target',
    'tiktok',
    'walmart',
    'warehance',
  ];

  it('defines capability metadata for every supported platform', () => {
    expect(Object.keys(CONNECTOR_CAPABILITIES).sort()).toEqual(
      platforms.sort(),
    );

    for (const platform of platforms) {
      const profile = getConnectorCapability(platform);

      expect(profile.platform).toBe(platform);
      expect(profile.domains.length).toBeGreaterThan(0);
      expect(profile.rateLimit.maxRetries).toBeGreaterThan(0);
      expect(profile.rateLimit.baseDelayMs).toBeGreaterThan(0);
    }
  });

  it('captures platform domain limitations', () => {
    expect(connectorSupportsDomain('shopify', 'returns')).toBe(true);
    expect(connectorSupportsDomain('amazon', 'returns')).toBe(true);
    expect(connectorSupportsDomain('faire', 'returns')).toBe(false);
    expect(connectorSupportsDomain('warehance', 'returns')).toBe(false);
  });
});
