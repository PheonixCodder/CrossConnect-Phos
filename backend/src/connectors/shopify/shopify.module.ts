import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShopifyService } from './shopify.service';
import { ShopifyOAuthService } from '../oauth/shopify-oauth.service';
import { ShopifyOAuthHook } from '../../api/webhooks/connectors/shopify/shopify-oauth.hook';
import { ShopifyWebhookModule } from '../../api/webhooks/connectors/shopify/shopify.module';
import { ShopifyAuthController } from './shopify.controller';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient(), ShopifyWebhookModule],
  providers: [ShopifyService, ShopifyOAuthService, ShopifyOAuthHook],
  controllers: [ShopifyAuthController],
  exports: [ShopifyService],
})
export class ShopifyModule {}
