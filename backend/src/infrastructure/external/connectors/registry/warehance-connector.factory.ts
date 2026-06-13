import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WarehanceCredentials } from '../../../../application/connectors/connector.types';
import { WarehanceService } from '../warehance/warehance.service';
import { ConnectorServiceFactory } from '../../../../application/connectors/registry/connector-service-factory.types';

@Injectable()
export class WarehanceConnectorFactory
  implements ConnectorServiceFactory<'warehance'>
{
  readonly platform = 'warehance' as const;

  constructor(private readonly moduleRef: ModuleRef) {}

  async create(credentials: WarehanceCredentials): Promise<WarehanceService> {
    const service = await this.moduleRef.create(WarehanceService);
    service.initialize(credentials);
    return service;
  }
}
