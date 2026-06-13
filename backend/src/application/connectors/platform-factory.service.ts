import { Injectable } from '@nestjs/common';
import { Database } from '../../infrastructure/persistence/supabase/supabase.types';
import {
  getConnectorCapability,
  CONNECTOR_CAPABILITIES,
} from './connector-capabilities';
import { getValidatedConnectorCredentials } from './connector-credentials';
import { PlatformCapabilityProfile } from './connector.types';
import { ConnectorRegistryService } from './registry/connector-registry.service';

@Injectable()
export class PlatformServiceFactory {
  constructor(private readonly connectorRegistry: ConnectorRegistryService) {}

  async createService(
    platform: Database['public']['Enums']['platform_types'],
    credentials: unknown,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    const validatedCredentials = getValidatedConnectorCredentials(
      platform,
      credentials,
    );

    return this.connectorRegistry.create(platform, validatedCredentials, {
      store,
    });
  }

  getCapability(
    platform: Database['public']['Enums']['platform_types'],
  ): PlatformCapabilityProfile {
    return getConnectorCapability(platform);
  }

  getCapabilities(): PlatformCapabilityProfile[] {
    return Object.values(CONNECTOR_CAPABILITIES);
  }
}
