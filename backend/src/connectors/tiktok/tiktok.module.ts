import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TikTokOAuthService } from '../oauth/tiktok-oauth.service';
import { SupabaseModule } from 'nestjs-supabase-js';
import { TikTokService } from './tiktok.service';
import { TikTokOAuthController } from './tiktok.controller';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [TikTokService, TikTokOAuthService],
  controllers: [TikTokOAuthController],
  exports: [TikTokService],
})
export class TikTokModule {}
