import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalmartWebhooksService } from './walmart.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [WalmartWebhooksService],
  controllers: [],
  exports: [WalmartWebhooksService],
})
export class WalmartWebhooksModule {}
