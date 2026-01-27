import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SupabaseModule } from 'nestjs-supabase-js';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [SupabaseModule.injectClient(), JobsModule],
  providers: [TasksService],
})
export class TasksModule {}
