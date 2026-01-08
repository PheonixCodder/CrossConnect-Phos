import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, SupabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
