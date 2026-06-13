import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TargetCredentials } from '../../../../application/connectors/connector.types';
import { TargetService } from '../target/target.service';
import { ConnectorServiceFactory } from '../../../../application/connectors/registry/connector-service-factory.types';

@Injectable()
export class TargetConnectorFactory
  implements ConnectorServiceFactory<'target'>
{
  readonly platform = 'target' as const;

  constructor(private readonly moduleRef: ModuleRef) {}

  async create(credentials: TargetCredentials): Promise<TargetService> {
    const service = await this.moduleRef.create(TargetService);
    service.initialize(credentials);
    return service;
  }
}
