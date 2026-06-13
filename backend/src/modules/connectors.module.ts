import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PlatformServiceFactory } from '../application/connectors/platform-factory.service';
import { ConnectorRegistryService } from '../application/connectors/registry/connector-registry.service';
import { AmazonModule } from '../infrastructure/external/connectors/amazon/amazon.module';
import { FaireModule } from '../infrastructure/external/connectors/faire/faire.module';
import { AmazonConnectorFactory } from '../infrastructure/external/connectors/registry/amazon-connector.factory';
import { FaireConnectorFactory } from '../infrastructure/external/connectors/registry/faire-connector.factory';
import { ShopifyConnectorFactory } from '../infrastructure/external/connectors/registry/shopify-connector.factory';
import { TargetConnectorFactory } from '../infrastructure/external/connectors/registry/target-connector.factory';
import { TikTokConnectorFactory } from '../infrastructure/external/connectors/registry/tiktok-connector.factory';
import { WalmartConnectorFactory } from '../infrastructure/external/connectors/registry/walmart-connector.factory';
import { WarehanceConnectorFactory } from '../infrastructure/external/connectors/registry/warehance-connector.factory';
import { ShopifyModule } from '../infrastructure/external/connectors/shopify/shopify.module';
import { TargetModule } from '../infrastructure/external/connectors/target/target.module';
import { TikTokModule } from '../infrastructure/external/connectors/tiktok/tiktok.module';
import { WalmartModule } from '../infrastructure/external/connectors/walmart/walmart.module';
import { WarehanceModule } from '../infrastructure/external/connectors/warehance/warehance.module';

@Module({
  imports: [
    HttpModule,
    FaireModule,
    WalmartModule,
    TargetModule,
    AmazonModule,
    ShopifyModule,
    WarehanceModule,
    TikTokModule,
  ],
  providers: [
    AmazonConnectorFactory,
    FaireConnectorFactory,
    ShopifyConnectorFactory,
    TargetConnectorFactory,
    TikTokConnectorFactory,
    WalmartConnectorFactory,
    WarehanceConnectorFactory,
    ConnectorRegistryService,
    PlatformServiceFactory,
  ],
  exports: [
    PlatformServiceFactory,
    ConnectorRegistryService,
    FaireModule,
    WalmartModule,
    TargetModule,
    AmazonModule,
    ShopifyModule,
    WarehanceModule,
    TikTokModule,
  ],
})
export class ConnectorsModule {}
