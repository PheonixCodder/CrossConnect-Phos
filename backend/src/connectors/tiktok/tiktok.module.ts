import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalmartService } from './walmart.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [WalmartService],
  controllers: [],
  exports: [WalmartService],
})
export class WalmartModule {}
