import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';
import { ReturnsRepositoryPort } from '../../../../domain/repositories/repository-ports';

@Injectable()
export class ReturnsRepository implements ReturnsRepositoryPort {
  private readonly batchSize = 300;

  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async insertReturns(
    returns: Database['public']['Tables']['returns']['Insert'][],
  ): Promise<{ data: unknown[] | null; error: unknown }> {
    if (!returns.length) {
      return { data: [], error: null };
    }

    const allData: unknown[] = [];

    for (let i = 0; i < returns.length; i += this.batchSize) {
      const batch = returns.slice(i, i + this.batchSize);
      const { data, error } = await this.supabaseClient
        .from('returns')
        .upsert(batch, {
          onConflict: 'external_return_id',
        });

      if (error) {
        return { data: allData.length ? allData : null, error };
      }

      const batchData = data as unknown;
      if (Array.isArray(batchData)) {
        allData.push(...batchData);
      }
    }

    return { data: allData.length ? allData : null, error: null };
  }
}
