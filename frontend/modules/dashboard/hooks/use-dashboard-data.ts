"use client";

import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/store/useStore";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";
import {useMemo} from "react";

export interface DateRangeValue {
  from: Date;
  to: Date;
}

export interface StoreMetrics {
  storeId: string;
  sales: number;
  orders: number;
  units: number;
}

interface DashboardPayload {
  orders: Database["public"]["Tables"]["orders"]["Row"][];
  order_items: Database["public"]["Tables"]["order_items"]["Row"][];
  returns: Database["public"]["Tables"]["returns"]["Row"][];
  products: Database["public"]["Tables"]["products"]["Row"][];
  inventory: Database["public"]["Tables"]["inventory"]["Row"][];
  alerts: Database["public"]["Tables"]["alerts"]["Row"][];
}

export function useDashboardData(dateRange: DateRangeValue) {
  const supabase = useMemo(() => createClient(), []);
  const { activeOrg, activeStore } = useDashboardStore();

  const startDateIso = useMemo(
      () => dateRange.from.toISOString(),
      [dateRange.from]
  );

  const endDateIso = useMemo(
      () => dateRange.to.toISOString(),
      [dateRange.to]
  );

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
    staleTime: 1000 * 60 * 5,
  });

  const targetStoreIds = useMemo(() => {
    if (activeStore?.id) return [activeStore.id];
    return stores.map((s) => s.id);
  }, [activeStore?.id, stores]);

  const storeIdsKey = useMemo(
      () => targetStoreIds.join(","),
      [targetStoreIds]
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [
      "dashboard_bundle",
      storeIdsKey,
      startDateIso,
      endDateIso,
    ],
    queryFn: async (): Promise<DashboardPayload> => {
      const { data, error } = await supabase.rpc(
          "get_complete_dashboard_data",
          {
            p_store_ids: targetStoreIds,
            p_start_date: startDateIso,
            p_end_date: endDateIso,
          }
      );

      if (error) throw error;
      return (data as unknown) as DashboardPayload;
    },
    enabled:
        !!storeIdsKey &&
        !!startDateIso &&
        !!endDateIso,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    isFetching,
  };
}
