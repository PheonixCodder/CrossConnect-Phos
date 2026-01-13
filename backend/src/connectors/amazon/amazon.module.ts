import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AmazonService } from './amazon.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [AmazonService],
  controllers: [],
  exports: [AmazonService],
})
export class AmazonModule {}
