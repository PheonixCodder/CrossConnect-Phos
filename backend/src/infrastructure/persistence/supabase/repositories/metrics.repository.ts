import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';
import { MetricsRepositoryPort } from '../../../../domain/repositories/repository-ports';

@Injectable()
export class MetricsRepository implements MetricsRepositoryPort {
  private readonly logger = new Logger(MetricsRepository.name);

  constructor(
    @InjectSupabaseClient()
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async bulkUpsertMetrics(
    items: Database['public']['Tables']['metrics_summary']['Insert'][],
  ): Promise<{ count: number }> {
    if (!items?.length) {
      this.logger.debug('No metrics to upsert');
      return { count: 0 };
    }

    const BATCH_SIZE = 300; // 1000–3000 usually safe; start lower if timeouts persist
    let processed = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      this.logger.debug(
        `Upserting metrics batch ${Math.floor(i / BATCH_SIZE) + 1} ` +
          `(${batch.length} rows, total so far ${processed})`,
      );

      const { error, data } = await this.supabase
        .from('metrics_summary')
        .upsert(batch, {
          onConflict: 'date,metric_type,store_id',
        })
        .select('id');

      const count = data?.length || 0;

      if (error) {
        this.logger.error('Batch upsert failed', {
          batchSize: batch.length,
          errorCode: error.code,
          errorMsg: error.message,
          hint: error.hint,
        });
        throw error;
      }

      processed += count ?? batch.length;
    }

    this.logger.log(`Bulk upserted ${processed} metrics`);
    return { count: processed };
  }
}
