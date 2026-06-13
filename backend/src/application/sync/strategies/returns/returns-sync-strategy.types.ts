import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
import { SyncStrategyContext } from '../../sync-strategy.types';

export type ReturnsSyncStrategyContext = SyncStrategyContext<
  unknown,
  Database['public']['Tables']['stores']['Row']
>;
