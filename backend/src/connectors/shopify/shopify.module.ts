import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShopifyService } from './shopify.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [ShopifyService],
  controllers: [],
  exports: [ShopifyService],
})
export class ShopifyModule {}
