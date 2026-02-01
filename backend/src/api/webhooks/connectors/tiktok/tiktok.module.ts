import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TikTokWebhooksService } from './tiktok.service';
import { TikTokWebhookController } from './tiktok.controller';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [TikTokWebhooksService],
  controllers: [TikTokWebhookController],
})
export class TikTokWebhooksModule {}
