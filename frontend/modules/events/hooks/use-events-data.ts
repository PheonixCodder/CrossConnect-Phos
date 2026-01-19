"use client";

import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/types/supabase.types";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";

type RawEventRow = Database["public"]["Tables"]["raw_events"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

// Extended type including joined store details
export type EventWithStore = RawEventRow & {
  stores: StoreRow | null;
};

// Define the structure for filters passed from the View
export type EventFilters = {
  platform: string;
  search: string;
};

export function useEventsData(filters: EventFilters) {
  const orgId = useDashboardStore((state) => state.activeOrg?.id);
  const supabase = createClient();
  const {
    data: events,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["raw_events", orgId],
    queryFn: async (): Promise<EventWithStore[]> => {
      const { data, error } = await supabase
        .from("raw_events")
        .select("*, stores!inner(name)")
        .eq("stores.org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw new Error(error.message);
      return (data as EventWithStore[]) ?? [];
    },
    enabled: !!orgId,
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  // --- Client-side Filtering Logic ---
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event) => {
      // 1. Filter by Platform
      // We check if it is "all" or empty string to allow clearing filters
      const matchesPlatform =
        !filters.platform ||
        filters.platform === "all" ||
        event.platform === filters.platform;

      // 2. Filter by Search
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        event.external_event_id.toLowerCase().includes(searchLower) ||
        event.entity.toLowerCase().includes(searchLower);

      return matchesPlatform && matchesSearch;
    });
  }, [events, filters]);

  return {
    events: filteredEvents,
    isLoading,
    error,
  };
}
