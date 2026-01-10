import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';

@Injectable()
export class FulfillmentsRepository {
  private readonly logger = new Logger(FulfillmentsRepository.name);

  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async insertShipments(
    shipments: Database['public']['Tables']['fulfillments']['Insert'][],
  ) {
    if (!shipments || shipments.length === 0) return { data: [], error: null };

    try {
      const { data, error } = await this.supabaseClient
        .from('fulfillments')
        .upsert(shipments, { onConflict: 'external_fulfillment_id' })
        .select('*');

      if (error) this.logger.error('Error upserting shipments', error);

      return { data, error };
    } catch (err) {
      this.logger.error('Unexpected error inserting shipments', err);
      throw err;
    }
  }
}
