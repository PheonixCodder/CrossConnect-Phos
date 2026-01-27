import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PlatformServiceFactory } from './platform-factory.service';
import { FaireModule } from './faire/faire.module';
import { TargetModule } from './target/target.module';
import { WalmartModule } from './walmart/walmart.module';
import { AmazonModule } from './amazon/amazon.module';
import { ShopifyModule } from './shopify/shopify.module';
import { WarehanceModule } from './warehouse/warehance.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    FaireModule,
    TargetModule,
    WalmartModule,
    AmazonModule,
    ShopifyModule,
    WarehanceModule,
    JobsModule,
  ],
  providers: [PlatformServiceFactory],
  exports: [PlatformServiceFactory],
})
export class ConnectorsModule {}
