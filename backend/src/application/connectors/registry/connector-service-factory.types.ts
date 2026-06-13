import { Database } from '../../../infrastructure/persistence/supabase/supabase.types';
import {
  ConnectorCredentialsByPlatform,
  PlatformType,
} from '../connector.types';

export type StoreRow = Database['public']['Tables']['stores']['Row'];

export interface ConnectorCreateContext {
  store: StoreRow;
}

export interface ConnectorServiceFactory<P extends PlatformType = PlatformType> {
  readonly platform: P;
  create(
    credentials: ConnectorCredentialsByPlatform[P],
    context?: ConnectorCreateContext,
  ): unknown | Promise<unknown>;
}
