import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AmazonService } from './amazon.service';
import { AmazonOAuthService } from '../oauth/amazon-oauth.service';
import { SupabaseModule } from 'nestjs-supabase-js';
import { AmazonController } from './amazon.controller';
import { SpApiThrottleManager } from '../amazon/throttle.manager';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [AmazonService, AmazonOAuthService, SpApiThrottleManager],
  controllers: [AmazonController],
  exports: [AmazonService, SpApiThrottleManager],
})
export class AmazonModule {}
