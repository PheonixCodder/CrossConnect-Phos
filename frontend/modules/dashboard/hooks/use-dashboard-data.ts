"use client";

import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/store/useStore";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";

export type TimeRange = "7d" | "30d" | "90d" | "1y";
export interface StoreMetrics {
  storeId: string;
  sales: number;
  orders: number;
  units: number;
}

// Define the shape based on our RPC return
interface DashboardPayload {
  orders: Database["public"]["Tables"]["orders"]["Row"][];
  order_items: Database["public"]["Tables"]["order_items"]["Row"][];
  returns: Database["public"]["Tables"]["returns"]["Row"][];
  products: Database["public"]["Tables"]["products"]["Row"][];
  inventory: Database["public"]["Tables"]["inventory"]["Row"][];
  alerts: Database["public"]["Tables"]["alerts"]["Row"][];
}

export function useDashboardData(timeRange: TimeRange) {
  const supabase = createClient();
  const { activeOrg, activeStore } = useDashboardStore();

  // 1. Calculate Date Range
  const subDaysMap: Record<TimeRange, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (subDaysMap[timeRange] || 7));
  const startDateIso = startDate.toISOString();

  // 2. Resolve Stores for the query
  // We still fetch stores normally as they are the "anchor" for the dashboard
  const { data: stores = [] } = useQuery({
    queryKey: ["stores", activeOrg?.id],
    queryFn: async () => {
      const { data, error } = await supabase
          .from("stores")
          .select("*")
          .eq("org_id", activeOrg?.id as string);
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrg?.id,
  });

  const targetStoreIds = activeStore ? [activeStore.id] : stores.map((s) => s.id);

  // 3. The "Big Bang" RPC Query
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard_bundle", targetStoreIds, timeRange],
    queryFn: async (): Promise<DashboardPayload> => {
      const { data, error } = await supabase.rpc("get_complete_dashboard_data", {
        p_store_ids: targetStoreIds,
        p_start_date: startDateIso,
      });

      if (error) throw error;
      return (data as unknown) as DashboardPayload;
    },
    enabled: targetStoreIds.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to prevent over-fetching
  });

  return {
    stores,
    orders: data?.orders ?? [],
    orderItems: data?.order_items ?? [],
    returns: data?.returns ?? [],
    products: data?.products ?? [],
    inventory: data?.inventory ?? [],
    alerts: data?.alerts ?? [],
    isLoading,
    refetch,
    error,
    isFetching
  };
}