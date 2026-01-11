import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class ReturnsRepository {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async insertReturns(
    returns: Database['public']['Tables']['returns']['Insert'][],
  ) {
    if (!returns.length) {
      return { data: [], error: null };
    }

    return await this.supabaseClient.from('returns').upsert(returns, {
      onConflict: 'external_return_id',
    });
  }
}
