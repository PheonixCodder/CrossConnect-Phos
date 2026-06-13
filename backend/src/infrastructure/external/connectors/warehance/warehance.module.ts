import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WarehanceService } from './warehance.service';
import { ALERTS_REPOSITORY } from '../../../../domain/repositories/repository-ports';
import { AlertsRepository } from '../../../../infrastructure/persistence/supabase/repositories/alerts.repository';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [ConfigModule, HttpModule, SupabaseModule.injectClient()],
  providers: [
    WarehanceService,
    AlertsRepository,
    {
      provide: ALERTS_REPOSITORY,
      useExisting: AlertsRepository,
    },
  ],
  controllers: [],
  exports: [WarehanceService],
})
export class WarehanceModule {}
