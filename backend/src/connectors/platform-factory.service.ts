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
import { AlertsRepository } from 'src/supabase/repositories/alerts.repository';

@Injectable()
export class PlatformServiceFactory {
  private readonly logger = new Logger(PlatformServiceFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly alertsRepo: AlertsRepository,
  ) {}

  createService(
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
        return this.createWalmartService(credentials);
      case 'amazon':
        return this.createAmazonService(credentials);
      case 'shopify':
        return this.createShopifyService(credentials);
      case 'warehance':
        return this.createWarehanceService(credentials);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private createShopifyService(credentials: any): ShopifyService {
    const service = new ShopifyService();
    service.initialize(credentials);
    return service;
  }

  private createWarehanceService(credentials: any): WarehanceService {
    const service = new WarehanceService(this.alertsRepo);
    service.initialize(credentials);
    return service;
  }

  private createWalmartService(credentials: any): WalmartService {
    const service = new WalmartService();
    service.initialize(credentials);
    return service;
  }

  private createTargetService(credentials: any): TargetService {
    const service = new TargetService(this.httpService);
    service.initialize(credentials);
    return service;
  }

  private createFaireService(credentials: any): FaireService {
    const service = new FaireService(this.httpService);
    service.initialize(credentials);
    return service;
  }

  private createAmazonService(credentials: any): AmazonService {
    const service = new AmazonService();
    service.initialize(credentials);
    return service;
  }
}
