import { SyncStrategyRegistry } from './sync-strategy.registry';
import { SyncStrategy } from './sync-strategy.types';

describe('SyncStrategyRegistry', () => {
  it('dispatches to the registered platform strategy', async () => {
    const sync = jest.fn().mockResolvedValue(undefined);
    const strategies: SyncStrategy<{ value: string }>[] = [
      { platform: 'shopify', domain: 'products', sync },
    ];
    const registry = new SyncStrategyRegistry('products', strategies);

    await registry.sync('shopify', { value: 'payload' });

    expect(sync).toHaveBeenCalledWith({ value: 'payload' });
    expect(registry.platforms()).toEqual(['shopify']);
  });

  it('fails fast when no platform strategy is registered', async () => {
    const registry = new SyncStrategyRegistry('orders', []);

    await expect(registry.sync('amazon', {})).rejects.toThrow(
      'No orders sync strategy registered for platform amazon',
    );
  });

  it('guards against strategies registered under the wrong domain', async () => {
    const registry = new SyncStrategyRegistry('returns', [
      {
        platform: 'walmart',
        domain: 'orders',
        sync: jest.fn(),
      },
    ]);

    await expect(registry.sync('walmart', {})).rejects.toThrow(
      'Invalid strategy domain orders for returns registry',
    );
  });
});
