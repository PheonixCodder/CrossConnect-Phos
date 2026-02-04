"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/modules/dashboard/ui/components/NotificationsCard";
import { Package, TrendingUp, WifiOff } from "lucide-react";
import { useDashboardStore } from "@/store/useStore";

export function useNotifications(limit = 20) {
  const supabase = createClient();
  const { activeStore, activeOrg } = useDashboardStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);

    let query = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (activeStore) {
      query = query.eq("store_id", activeStore.id);
    }

    const { data, error } = await query;

    if (error || !data) {
      setLoading(false);
      return;
    }

    const mapped: Notification[] = data.map((alert) => {
      let state: "error" | "warning" | "success" = "success";

      if (alert.severity === "critical" || alert.severity === "high")
        state = "error";
      else if (alert.severity === "medium") state = "warning";

      const channel = alert.platform
          ? alert.platform.charAt(0).toUpperCase() + alert.platform.slice(1)
          : "All Channels";

      const timeAgoMs = Date.now() - new Date(alert.created_at).getTime();
      const timeAgo =
          timeAgoMs < 60_000
              ? "just now"
              : timeAgoMs < 3_600_000
                  ? `${Math.floor(timeAgoMs / 60_000)}m ago`
                  : timeAgoMs < 86_400_000
                      ? `${Math.floor(timeAgoMs / 3_600_000)}h ago`
                      : `${Math.floor(timeAgoMs / 86_400_000)}d ago`;

      let icon = WifiOff;
      if (state === "warning") icon = Package;
      else if (state === "success") icon = TrendingUp;

      return {
        id: alert.id,
        icon,
        state,
        channel,
        description: alert.message,
        timeAgo,
        read: alert.resolved ?? false,
      };
    });

    setNotifications(mapped);
    setLoading(false);
  }, [activeStore, limit, supabase]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { notifications, loading, refetch: fetchAlerts };
}
