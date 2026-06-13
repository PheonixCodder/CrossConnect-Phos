import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { Database } from '../supabase.types';
import {
  PersistedWebhookEvent,
  WebhookIngestPayload,
} from '../../../../application/webhooks/webhook-event.types';
import { WebhookEventsRepositoryPort } from '../../../../domain/repositories/repository-ports';

@Injectable()
export class EventsRepository implements WebhookEventsRepositoryPort {
  constructor(
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  async persistRawEvent(
    event: WebhookIngestPayload,
  ): Promise<PersistedWebhookEvent> {
    const insert: Database['public']['Tables']['raw_events']['Insert'] = {
      platform: event.provider,
      store_id: event.storeId,
      external_event_id: event.eventId,
      event_type: event.topic,
      entity: inferWebhookEntity(event.topic),
      payload:
        event.payload as Database['public']['Tables']['raw_events']['Insert']['payload'],
      received_at: event.receivedAt ?? new Date().toISOString(),
    };

    const { data, error } = await this.supabaseClient
      .from('raw_events')
      .upsert(insert, {
        onConflict: 'external_event_id',
        ignoreDuplicates: true,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      rawEventId: data?.id ?? event.eventId,
      duplicate: !data?.id,
    };
  }

  async getRawEventPayload(rawEventId: string): Promise<unknown | null> {
    const { data, error } = await this.supabaseClient
      .from('raw_events')
      .select('payload')
      .eq('id', rawEventId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.payload ?? null;
  }
}

function inferWebhookEntity(topic: string): string {
  const [entity] = topic.toLowerCase().split(/[_./:-]/);

  return entity || 'unknown';
}
