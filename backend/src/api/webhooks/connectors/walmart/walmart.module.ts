import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalmartWebhookService } from './walmart.service';
import { WalmartWebhookController } from './walmart.controller';
import { SupabaseModule } from 'nestjs-supabase-js';
import { StoresRepository } from '../../../../supabase/repositories/stores.repository';
import { WalmartWebhookGuard } from '../../guards/walmart-webhook.guard';
import { WalmartWebhookProcessor } from './walmart-webhook.processor';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [WalmartWebhookGuard, WalmartWebhookService, WalmartWebhookProcessor, StoresRepository],
  controllers: [WalmartWebhookController],
})
export class WalmartWebhooksModule {}
