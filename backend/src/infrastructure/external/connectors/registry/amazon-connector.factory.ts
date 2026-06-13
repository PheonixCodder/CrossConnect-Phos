import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AmazonService } from '../amazon/amazon.service';
import { AmazonCredentials } from '../../../../application/connectors/connector.types';
import { ConnectorServiceFactory } from '../../../../application/connectors/registry/connector-service-factory.types';

@Injectable()
export class AmazonConnectorFactory
  implements ConnectorServiceFactory<'amazon'>
{
  readonly platform = 'amazon' as const;

  constructor(private readonly moduleRef: ModuleRef) {}

  async create(credentials: AmazonCredentials): Promise<AmazonService> {
    const service = await this.moduleRef.create(AmazonService);
    service.initialize(credentials);
    return service;
  }
}
