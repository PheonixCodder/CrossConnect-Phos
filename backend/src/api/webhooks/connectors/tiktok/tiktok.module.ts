import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TikTokWebhooksService } from './tiktok.service';
import { TikTokWebhookController } from './tiktok.controller';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [TikTokWebhooksService],
  controllers: [TikTokWebhookController],
})
export class TikTokWebhooksModule {}
