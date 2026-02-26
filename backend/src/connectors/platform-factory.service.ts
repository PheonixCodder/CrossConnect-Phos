import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FaireService } from './faire/faire.service';
import { TargetService } from './target/target.service';
import { WalmartService } from './walmart/walmart.service';
import { AmazonService } from './amazon/amazon.service';
import { ShopifyService } from './shopify/shopify.service';
import { WarehanceService } from './warehouse/warehance.service';
import { Database } from '../supabase/supabase.types';
import { AlertsRepository } from '../supabase/repositories/alerts.repository';
import { StoresRepository } from '../supabase/repositories/stores.repository';
import { TikTokService } from './tiktok/tiktok.service';
import { TikTokOAuthService } from './oauth/tiktok-oauth.service';
import { WalmartOAuthHook } from '../api/webhooks/connectors/walmart/walmart-oauth.hook';
import { CryptoService } from '../common/crypto.service';
import { SpApiThrottleManager } from 'connectors/amazon/throttle.manager';

@Injectable()
export class PlatformServiceFactory {
  private readonly logger = new Logger(PlatformServiceFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly alertsRepo: AlertsRepository,
    private readonly storeRepo: StoresRepository,
    private tiktokOAuthService: TikTokOAuthService,
    private readonly walmartOAuthHook: WalmartOAuthHook,
    private crypto: CryptoService,
    private throttle: SpApiThrottleManager,
  ) {}

  async createService(
    platform: Database['public']['Enums']['platform_types'],
    credentials: any,
    store: Database['public']['Tables']['stores']['Row'],
  ) {
    switch (platform) {
      case 'faire':
        return this.createFaireService(credentials);
      case 'target':
        return this.createTargetService(credentials);
      case 'walmart':
        return this.createWalmartService(credentials, store);
      case 'amazon':
        return this.createAmazonService(credentials);
      case 'shopify':
        return this.createShopifyService(credentials);
      case 'warehance':
        return this.createWarehanceService(credentials);
      case 'tiktok':
        return this.createTiktokService(credentials);
    }
  }

  private createShopifyService(credentials: any): ShopifyService {
    const service = new ShopifyService(this.crypto);
    service.initialize(credentials);
    return service;
  }

  private createWarehanceService(credentials: any): WarehanceService {
    const service = new WarehanceService(this.alertsRepo, this.crypto);
    service.initialize(credentials);
    return service;
  }

  private async createWalmartService(
    credentials: any,
    store: Database['public']['Tables']['stores']['Row'],
  ): Promise<WalmartService> {
    const service = new WalmartService(
      this.walmartOAuthHook,
      this.storeRepo,
      this.crypto,
    );
    await service.initialize(credentials, store);
    return service;
  }

  private createTargetService(credentials: any): TargetService {
    const service = new TargetService(this.httpService, this.crypto);
    service.initialize(credentials);
    return service;
  }

  private createFaireService(credentials: any): FaireService {
    const service = new FaireService(this.httpService, this.crypto);
    service.initialize(credentials);
    return service;
  }

  private createAmazonService(credentials: any): AmazonService {
    const service = new AmazonService(this.crypto, this.throttle);
    service.initialize(credentials);
    return service;
  }

  private createTiktokService(credentials: any): TikTokService {
    const service = new TikTokService(
      this.configService,
      this.tiktokOAuthService,
    );
    service.initialize();
    return service;
  }
}
