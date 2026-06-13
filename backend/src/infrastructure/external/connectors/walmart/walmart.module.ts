import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalmartService } from './walmart.service';
import { WalmartOAuthHook } from '../../../../application/webhooks/walmart/walmart-oauth.hook';
import { WalmartWebhookService } from '../../../../application/webhooks/walmart/walmart-webhook-subscription.service';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [
    WalmartService,
    WalmartWebhookService,
    WalmartOAuthHook,
  ],
  controllers: [],
  exports: [WalmartService, WalmartOAuthHook],
})
export class WalmartModule {}
