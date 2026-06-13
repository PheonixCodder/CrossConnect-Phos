import { Injectable } from '@nestjs/common';
import { Database } from '../../../infrastructure/persistence/supabase/supabase.types';
import { AmazonConnectorFactory } from '../../../infrastructure/external/connectors/registry/amazon-connector.factory';
import { FaireConnectorFactory } from '../../../infrastructure/external/connectors/registry/faire-connector.factory';
import { ShopifyConnectorFactory } from '../../../infrastructure/external/connectors/registry/shopify-connector.factory';
import { TargetConnectorFactory } from '../../../infrastructure/external/connectors/registry/target-connector.factory';
import { TikTokConnectorFactory } from '../../../infrastructure/external/connectors/registry/tiktok-connector.factory';
import { WalmartConnectorFactory } from '../../../infrastructure/external/connectors/registry/walmart-connector.factory';
import { WarehanceConnectorFactory } from '../../../infrastructure/external/connectors/registry/warehance-connector.factory';
import { ConnectorCredentialsByPlatform, PlatformType } from '../connector.types';
import {
  ConnectorCreateContext,
  ConnectorServiceFactory,
} from './connector-service-factory.types';

@Injectable()
export class ConnectorRegistryService {
  private readonly factories = new Map<PlatformType, ConnectorServiceFactory>();

  constructor(
    amazonFactory: AmazonConnectorFactory,
    faireFactory: FaireConnectorFactory,
    shopifyFactory: ShopifyConnectorFactory,
    targetFactory: TargetConnectorFactory,
    tiktokFactory: TikTokConnectorFactory,
    walmartFactory: WalmartConnectorFactory,
    warehanceFactory: WarehanceConnectorFactory,
  ) {
    for (const factory of [
      amazonFactory,
      faireFactory,
      shopifyFactory,
      targetFactory,
      tiktokFactory,
      walmartFactory,
      warehanceFactory,
    ]) {
      this.factories.set(factory.platform, factory);
    }
  }

  create<P extends PlatformType>(
    platform: P,
    credentials: ConnectorCredentialsByPlatform[P],
    context?: ConnectorCreateContext,
  ): unknown | Promise<unknown> {
    const factory = this.factories.get(platform);

    if (!factory) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return factory.create(credentials, context);
  }

  supports(platform: Database['public']['Enums']['platform_types']): boolean {
    return this.factories.has(platform);
  }

  registeredPlatforms(): PlatformType[] {
    return [...this.factories.keys()];
  }
}
