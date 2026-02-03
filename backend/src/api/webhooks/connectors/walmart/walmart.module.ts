import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalmartWebhookService } from './walmart.service';
import { WalmartWebhookController } from './walmart.controller';
import { SupabaseModule } from 'nestjs-supabase-js';
import { StoresRepository } from '../../../../supabase/repositories/stores.repository';
import { WalmartWebhookGuard } from '../../guards/walmart-webhook.guard';
import { WalmartWebhookProcessor } from './walmart-webhook.processor';
import { CommonModule } from '../../../../common/common.module';
import { WalmartOAuthHook } from "./walmart-oauth.hook";

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SupabaseModule.injectClient(),
    CommonModule,
  ],
  providers: [
    WalmartWebhookGuard,
    WalmartWebhookService,
    WalmartWebhookProcessor,
    StoresRepository,
    WalmartOAuthHook,
  ],
  controllers: [WalmartWebhookController],
})
export class WalmartWebhooksModule {}
