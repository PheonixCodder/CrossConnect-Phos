import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WarehanceService } from './warehance.service';
import { AlertsRepository } from '../../supabase/repositories/alerts.repository';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [WarehanceService, AlertsRepository],
  controllers: [],
  exports: [WarehanceService],
})
export class WarehanceModule {}
