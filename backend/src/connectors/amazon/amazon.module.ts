import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AmazonService } from './amazon.service';
import { AmazonOAuthService } from '../oauth/amazon-oauth.service';
import { SupabaseModule } from 'nestjs-supabase-js';
import { AmazonController } from './amazon.controller';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [AmazonService, AmazonOAuthService],
  controllers: [AmazonController],
  exports: [AmazonService],
})
export class AmazonModule {}
