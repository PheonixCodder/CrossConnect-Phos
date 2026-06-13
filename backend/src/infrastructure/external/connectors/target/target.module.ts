import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TargetService } from './target.service';
import targetConfig from './target.config';

@Module({
  imports: [ConfigModule.forFeature(targetConfig), HttpModule],
  providers: [TargetService],
  controllers: [],
  exports: [TargetService],
})
export class TargetModule {}
