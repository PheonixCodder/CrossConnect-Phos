import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TasksService } from './tasks.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ConfigModule } from './config/config.module';
import { JobsModule } from './jobs/jobs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    JobsModule,
    ScheduleModule.forRoot(),
    LoggerModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [TasksService],
})
export class AppModule {}

// CronService -> Runs BullMQ Job(with platform type) -> BullMQ fetches According Platform Type(Tiktok Client) -> BullMQ maps to DB(Tiktok Mapper) -> Calls Repository
