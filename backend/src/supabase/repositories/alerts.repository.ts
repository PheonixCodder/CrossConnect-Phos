import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class AlertsRepository {
  private readonly logger = new Logger(AlertsRepository.name);

  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async createAlert(alert: Database['public']['Tables']['alerts']['Insert']) {
    const { error } = await this.supabaseClient.from('alerts').insert({
      ...alert,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      this.logger.error('Failed to create alert', error);
    }
  }
}
