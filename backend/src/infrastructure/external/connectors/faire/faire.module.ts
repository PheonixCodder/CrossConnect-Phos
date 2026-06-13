import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { FaireService } from './faire.service';
import { FaireAuthController } from './faire.controller';
import { SupabaseModule } from 'nestjs-supabase-js';
import { FaireOAuthService } from '../oauth/faire-oauth.service';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [FaireService, FaireOAuthService],
  controllers: [FaireAuthController],
  exports: [FaireService],
})
export class FaireModule {}
