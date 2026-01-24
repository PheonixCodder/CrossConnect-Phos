import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TasksService } from './tasks/tasks.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ConfigModule } from './config/config.module';
import { JobsModule } from './jobs/jobs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { ConnectorsModule } from './connectors/connectors.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    CommonModule,
    ConnectorsModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    JobsModule,
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  levelFirst: true,
                },
              }
            : undefined,
      },
    }),
  ],
  controllers: [AppController],
  providers: [TasksService],
})
export class AppModule {}
