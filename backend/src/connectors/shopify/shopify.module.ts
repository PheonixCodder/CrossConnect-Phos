import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShopifyService } from './shopify.service';
import { ShopifyOAuthService } from '../oauth/shopify-oauth.service';
import { ShopifyAuthController } from './shopify.controller';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [ShopifyService, ShopifyOAuthService],
  controllers: [ShopifyAuthController],
  exports: [ShopifyService],
})
export class ShopifyModule {}
