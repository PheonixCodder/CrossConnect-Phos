import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TikTokCredentials } from '../../../../application/connectors/connector.types';
import { TikTokService } from '../tiktok/tiktok.service';
import { ConnectorServiceFactory } from '../../../../application/connectors/registry/connector-service-factory.types';

@Injectable()
export class TikTokConnectorFactory
  implements ConnectorServiceFactory<'tiktok'>
{
  readonly platform = 'tiktok' as const;

  constructor(private readonly moduleRef: ModuleRef) {}

  async create(_credentials: TikTokCredentials): Promise<TikTokService> {
    const service = await this.moduleRef.create(TikTokService);
    service.initialize();
    return service;
  }
}
