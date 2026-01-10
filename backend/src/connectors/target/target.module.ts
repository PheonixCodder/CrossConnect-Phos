import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TargetService } from './target.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [TargetService],
  controllers: [],
  exports: [TargetService],
})
export class TargetModule {}
