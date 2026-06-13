import { ConnectorDomain, PlatformType } from '../connectors/connector.types';

export interface SyncStrategy<TContext> {
  platform: PlatformType;
  domain: ConnectorDomain;
  sync(context: TContext): Promise<void>;
}

export interface SyncStrategyContext<TService = unknown, TStore = unknown> {
  service: TService;
  store: TStore;
}
