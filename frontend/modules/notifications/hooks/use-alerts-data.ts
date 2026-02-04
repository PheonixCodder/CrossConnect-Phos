"use client";

import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/types/supabase.types";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";

type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

export type AlertWithStore = AlertRow & {
  stores: StoreRow | null;
};

export type AlertFilters = {
  platform: string;
  search: string;
  severity: string;
  resolved: string; // "all" | "resolved" | "open"
};

export function useAlertsData(filters: AlertFilters) {
  const orgId = useDashboardStore((s) => s.activeOrg?.id);
  const storeId = useDashboardStore((s) => s.activeStore?.id);
  const supabase = createClient();

  const {
    data: alerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["alerts", orgId, storeId],
    enabled: !!orgId,
    staleTime: 1000 * 30,
    refetchInterval: 30000,
    queryFn: async (): Promise<AlertWithStore[]> => {
      if (!orgId) return [];

      let query = supabase
          .from("alerts")
          .select("*, stores!inner(name)")
          .order("created_at", { ascending: false })
          .limit(200);

      // 🎯 STORE MODE
      if (storeId) {
        query = query.eq("store_id", storeId);
      }
      // 🎯 ORG MODE
      else {
        query = query.eq("stores.org_id", orgId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return (data as AlertWithStore[]) ?? [];
    },
  });

  // --- Client-side Filtering ---
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];

    return alerts.filter((alert) => {
      if (filters.platform && filters.platform !== "all") {
        if (alert.platform !== filters.platform) return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
            !alert.message.toLowerCase().includes(q) &&
            !alert.alert_type.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      if (filters.severity && filters.severity !== "all") {
        if (alert.severity !== filters.severity) return false;
      }

      if (filters.resolved === "resolved" && alert.resolved !== true) {
        return false;
      }

      if (filters.resolved === "open" && alert.resolved === true) {
        return false;
      }

      return true;
    });
  }, [alerts, filters]);

  return {
    alerts: filteredAlerts,
    isLoading,
    error,
  };
}
