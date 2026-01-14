import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WarehanceService } from './warehance.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [WarehanceService],
  controllers: [],
  exports: [WarehanceService],
})
export class WarehanceModule {}
