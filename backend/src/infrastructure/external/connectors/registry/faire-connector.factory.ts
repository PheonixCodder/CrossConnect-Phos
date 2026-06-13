import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FaireCredentials } from '../../../../application/connectors/connector.types';
import { FaireService } from '../faire/faire.service';
import { ConnectorServiceFactory } from '../../../../application/connectors/registry/connector-service-factory.types';

@Injectable()
export class FaireConnectorFactory implements ConnectorServiceFactory<'faire'> {
  readonly platform = 'faire' as const;

  constructor(private readonly moduleRef: ModuleRef) {}

  async create(credentials: FaireCredentials): Promise<FaireService> {
    const service = await this.moduleRef.create(FaireService);
    service.initialize(credentials);
    return service;
  }
}
