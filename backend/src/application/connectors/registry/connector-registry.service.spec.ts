import { ConnectorRegistryService } from './connector-registry.service';
import { AmazonConnectorFactory } from '../../../infrastructure/external/connectors/registry/amazon-connector.factory';
import { FaireConnectorFactory } from '../../../infrastructure/external/connectors/registry/faire-connector.factory';
import { ShopifyConnectorFactory } from '../../../infrastructure/external/connectors/registry/shopify-connector.factory';
import { TargetConnectorFactory } from '../../../infrastructure/external/connectors/registry/target-connector.factory';
import { TikTokConnectorFactory } from '../../../infrastructure/external/connectors/registry/tiktok-connector.factory';
import { WalmartConnectorFactory } from '../../../infrastructure/external/connectors/registry/walmart-connector.factory';
import { WarehanceConnectorFactory } from '../../../infrastructure/external/connectors/registry/warehance-connector.factory';
import { ConnectorServiceFactory } from './connector-service-factory.types';

function mockFactory<P extends ConnectorServiceFactory['platform']>(
  platform: P,
  create: jest.Mock,
): ConnectorServiceFactory<P> {
  return { platform, create } as ConnectorServiceFactory<P>;
}

describe('ConnectorRegistryService', () => {
  it('registers all supported platform factories', () => {
    const registry = new ConnectorRegistryService(
      mockFactory('amazon', jest.fn()) as unknown as AmazonConnectorFactory,
      mockFactory('faire', jest.fn()) as unknown as FaireConnectorFactory,
      mockFactory('shopify', jest.fn()) as unknown as ShopifyConnectorFactory,
      mockFactory('target', jest.fn()) as unknown as TargetConnectorFactory,
      mockFactory('tiktok', jest.fn()) as unknown as TikTokConnectorFactory,
      mockFactory('walmart', jest.fn()) as unknown as WalmartConnectorFactory,
      mockFactory('warehance', jest.fn()) as unknown as WarehanceConnectorFactory,
    );

    expect(registry.registeredPlatforms().sort()).toEqual(
      [
        'amazon',
        'faire',
        'shopify',
        'target',
        'tiktok',
        'walmart',
        'warehance',
      ].sort(),
    );
    expect(registry.supports('shopify')).toBe(true);
    expect(registry.supports('amazon')).toBe(true);
  });

  it('delegates creation to the registered factory', () => {
    const shopifyFactory = mockFactory('shopify', jest.fn().mockReturnValue({ initialized: true }));

    const registry = new ConnectorRegistryService(
      mockFactory('amazon', jest.fn()) as unknown as AmazonConnectorFactory,
      mockFactory('faire', jest.fn()) as unknown as FaireConnectorFactory,
      shopifyFactory as unknown as ShopifyConnectorFactory,
      mockFactory('target', jest.fn()) as unknown as TargetConnectorFactory,
      mockFactory('tiktok', jest.fn()) as unknown as TikTokConnectorFactory,
      mockFactory('walmart', jest.fn()) as unknown as WalmartConnectorFactory,
      mockFactory('warehance', jest.fn()) as unknown as WarehanceConnectorFactory,
    );

    const credentials = {
      shopDomain: 'encrypted-shop',
      accessToken: 'encrypted-token',
    };

    const service = registry.create('shopify', credentials);

    expect(shopifyFactory.create).toHaveBeenCalledWith(credentials, undefined);
    expect(service).toEqual({ initialized: true });
  });

  it('throws for unsupported platforms', () => {
    const registry = new ConnectorRegistryService(
      mockFactory('amazon', jest.fn()) as unknown as AmazonConnectorFactory,
      mockFactory('faire', jest.fn()) as unknown as FaireConnectorFactory,
      mockFactory('shopify', jest.fn()) as unknown as ShopifyConnectorFactory,
      mockFactory('target', jest.fn()) as unknown as TargetConnectorFactory,
      mockFactory('tiktok', jest.fn()) as unknown as TikTokConnectorFactory,
      mockFactory('walmart', jest.fn()) as unknown as WalmartConnectorFactory,
      mockFactory('warehance', jest.fn()) as unknown as WarehanceConnectorFactory,
    );

    expect(() =>
      registry.create('unknown-platform' as never, {} as never),
    ).toThrow('Unsupported platform: unknown-platform');
  });
});
