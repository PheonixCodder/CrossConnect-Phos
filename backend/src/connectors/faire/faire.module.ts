import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { FaireService } from './faire.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [FaireService],
  controllers: [],
  exports: [FaireService],
})
export class FaireModule {}
