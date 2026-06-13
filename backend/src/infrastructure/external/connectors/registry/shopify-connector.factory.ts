import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ShopifyCredentials } from '../../../../application/connectors/connector.types';
import { ShopifyService } from '../shopify/shopify.service';
import { ConnectorServiceFactory } from '../../../../application/connectors/registry/connector-service-factory.types';

@Injectable()
export class ShopifyConnectorFactory
  implements ConnectorServiceFactory<'shopify'>
{
  readonly platform = 'shopify' as const;

  constructor(private readonly moduleRef: ModuleRef) {}

  async create(credentials: ShopifyCredentials): Promise<ShopifyService> {
    const service = await this.moduleRef.create(ShopifyService);
    service.initialize(credentials);
    return service;
  }
}
