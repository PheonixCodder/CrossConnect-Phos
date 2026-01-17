import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalmartWebhooksService } from './walmart.service';
import { WalmartWebhookController } from './walmart.controller';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [WalmartWebhooksService],
  controllers: [WalmartWebhookController],
  exports: [WalmartWebhooksService],
})
export class WalmartWebhooksModule {}
