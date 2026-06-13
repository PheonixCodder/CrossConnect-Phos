import { Module } from '@nestjs/common';
import { SupabaseModule as NestSupabaseModule } from 'nestjs-supabase-js';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestSupabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        supabaseUrl: config.getOrThrow<string>('SUPABASE_URL'),
        supabaseKey: config.getOrThrow<string>('SUPABASE_SERVICE_KEY'),
      }),
    }),
  ],
  exports: [NestSupabaseModule],
})
export class SupabaseModule {}
