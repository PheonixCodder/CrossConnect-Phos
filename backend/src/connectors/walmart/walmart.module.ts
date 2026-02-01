import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalmartService } from './walmart.service';
import { StoresRepository } from '../../supabase/repositories/stores.repository';
import { WalmartOAuthHook } from '../../api/webhooks/connectors/walmart/walmart-oauth.hook';
import { WalmartWebhookService } from '../../api/webhooks/connectors/walmart/walmart.service';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [
    WalmartService,
    StoresRepository,
    WalmartWebhookService,
    WalmartOAuthHook,
  ],
  controllers: [],
  exports: [WalmartService, WalmartOAuthHook],
})
export class WalmartModule {}
