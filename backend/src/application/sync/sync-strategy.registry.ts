import { ConnectorDomain, PlatformType } from '../connectors/connector.types';
import { SyncStrategy } from './sync-strategy.types';

export class SyncStrategyRegistry<TContext> {
  private readonly strategiesByPlatform: Map<
    PlatformType,
    SyncStrategy<TContext>
  >;

  constructor(
    private readonly domain: ConnectorDomain,
    strategies: SyncStrategy<TContext>[],
  ) {
    this.strategiesByPlatform = new Map(
      strategies.map((strategy) => [strategy.platform, strategy]),
    );
  }

  get(platform: PlatformType): SyncStrategy<TContext> {
    const strategy = this.strategiesByPlatform.get(platform);

    if (!strategy) {
      throw new Error(
        `No ${this.domain} sync strategy registered for platform ${platform}`,
      );
    }

    return strategy;
  }

  async sync(platform: PlatformType, context: TContext): Promise<void> {
    const strategy = this.get(platform);

    if (strategy.domain !== this.domain) {
      throw new Error(
        `Invalid strategy domain ${strategy.domain} for ${this.domain} registry`,
      );
    }

    await strategy.sync(context);
  }

  platforms(): PlatformType[] {
    return Array.from(this.strategiesByPlatform.keys());
  }
}
