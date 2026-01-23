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

    const BATCH_SIZE = 3000; // Adjust based on testing; 5000 is safe for free plan

    let totalAffected = 0;
    let allData: Database['public']['Tables']['fulfillments']['Row'][] = [];

    try {
      for (let i = 0; i < shipments.length; i += BATCH_SIZE) {
        const batch = shipments.slice(i, i + BATCH_SIZE);

        this.logger.debug(
          `Upserting fulfillments batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(shipments.length / BATCH_SIZE)} (${batch.length} items)`,
        );

        const { data, error, count } = await this.supabaseClient
          .from('fulfillments')
          .upsert(batch, { onConflict: 'external_fulfillment_id' })
          .select('*');

        if (error) {
          this.logger.error('Error upserting fulfillments batch', error);
          throw error;
        }

        allData = allData.concat(data ?? []);
        totalAffected += count ?? batch.length;
      }

      this.logger.log(`Successfully upserted ${totalAffected} fulfillments`);

      return { data: allData, error: null };
    } catch (err) {
      this.logger.error('Unexpected error inserting fulfillments', err);
      throw err;
    }
  }
}
