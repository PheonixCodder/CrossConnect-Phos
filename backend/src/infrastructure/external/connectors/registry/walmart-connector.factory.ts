import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WalmartCredentials } from '../../../../application/connectors/connector.types';
import { WalmartService } from '../walmart/walmart.service';
import {
  ConnectorCreateContext,
  ConnectorServiceFactory,
} from '../../../../application/connectors/registry/connector-service-factory.types';

@Injectable()
export class WalmartConnectorFactory
  implements ConnectorServiceFactory<'walmart'>
{
  readonly platform = 'walmart' as const;

  constructor(private readonly moduleRef: ModuleRef) {}

  async create(
    credentials: WalmartCredentials,
    context?: ConnectorCreateContext,
  ): Promise<WalmartService> {
    if (!context?.store) {
      throw new Error('Walmart connector requires store context');
    }

    const service = await this.moduleRef.create(WalmartService);
    await service.initialize(credentials, context.store);
    return service;
  }
}
