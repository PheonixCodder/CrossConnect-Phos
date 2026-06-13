"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/modules/dashboard/ui/components/NotificationsCard";
import { Package, TrendingUp, WifiOff } from "lucide-react";
import { useDashboardStore } from "@/store/useStore";

function formatTimeAgo(createdAt: string) {
  const timeAgoMs = Date.now() - new Date(createdAt).getTime();

  if (timeAgoMs < 60_000) return "just now";
  if (timeAgoMs < 3_600_000) return `${Math.floor(timeAgoMs / 60_000)}m ago`;
  if (timeAgoMs < 86_400_000) {
    return `${Math.floor(timeAgoMs / 3_600_000)}h ago`;
  }
  return `${Math.floor(timeAgoMs / 86_400_000)}d ago`;
}

export function useNotifications(limit = 20) {
  const supabase = useMemo(() => createClient(), []);
  const activeStore = useDashboardStore((state) => state.activeStore);

  const query = useQuery({
    queryKey: ["notifications", activeStore?.id ?? "all", limit],
    queryFn: async (): Promise<Notification[]> => {
      let alertsQuery = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (activeStore) {
        alertsQuery = alertsQuery.eq("store_id", activeStore.id);
      }

      const { data, error } = await alertsQuery;
      if (error) throw error;

      return (data ?? []).map((alert) => {
        let state: "error" | "warning" | "success" = "success";

        if (alert.severity === "critical" || alert.severity === "high") {
          state = "error";
        } else if (alert.severity === "medium") {
          state = "warning";
        }

        const channel = alert.platform
          ? alert.platform.charAt(0).toUpperCase() + alert.platform.slice(1)
          : "All Channels";

        let icon = WifiOff;
        if (state === "warning") icon = Package;
        else if (state === "success") icon = TrendingUp;

        return {
          id: alert.id,
          icon,
          state,
          channel,
          description: alert.message,
          timeAgo: formatTimeAgo(alert.created_at),
          read: alert.resolved ?? false,
        };
      });
    },
    staleTime: 1000 * 60,
  });

  return {
    notifications: query.data ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
