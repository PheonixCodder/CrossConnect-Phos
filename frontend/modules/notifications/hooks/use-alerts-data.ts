"use client";

import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/types/supabase.types";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";

type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

// Extended type including joined store details
export type AlertWithStore = AlertRow & {
  stores: StoreRow | null;
};

// Define the structure for filters passed from the View
export type AlertFilters = {
  platform: string;
  search: string;
  severity: string;
  resolved: string; // "all" | "resolved" | "open"
};

export function useAlertsData(filters: AlertFilters) {
  const orgId = useDashboardStore((state) => state.activeOrg?.id);
  const supabase = createClient();

  const {
    data: alerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["alerts", orgId],
    queryFn: async (): Promise<AlertWithStore[]> => {
      // Join with stores to filter by org_id and get store name
      const { data, error } = await supabase
        .from("alerts")
        .select("*, stores!inner(name)")
        .eq("stores.org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw new Error(error.message);
      return (data as AlertWithStore[]) ?? [];
    },
    enabled: !!orgId,
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  // --- Client-side Filtering Logic ---
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];

    return alerts.filter((alert) => {
      // 1. Filter by Platform
      const matchesPlatform =
        !filters.platform ||
        filters.platform === "all" ||
        alert.platform === filters.platform;

      // 2. Filter by Search (Message or Type)
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        alert.message.toLowerCase().includes(searchLower) ||
        alert.alert_type.toLowerCase().includes(searchLower);

      // 3. Filter by Severity
      const matchesSeverity =
        !filters.severity ||
        filters.severity === "all" ||
        alert.severity === filters.severity;

      // 4. Filter by Resolved Status
      let matchesResolved = true;
      if (filters.resolved === "resolved") {
        matchesResolved = alert.resolved === true;
      } else if (filters.resolved === "open") {
        matchesResolved = alert.resolved === false || alert.resolved === null;
      }

      return matchesPlatform && matchesSearch && matchesSeverity && matchesResolved;
    });
  }, [alerts, filters]);

  return {
    alerts: filteredAlerts,
    isLoading,
    error,
  };
}