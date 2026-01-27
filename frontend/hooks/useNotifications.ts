"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";
import type { Notification } from "@/modules/dashboard/ui/components/NotificationsCard";
import { Package, TrendingUp, WifiOff } from "lucide-react";

export function useNotifications(limit = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchAlerts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching alerts:", error.message);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
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
              : timeAgoMs < 3600_000
                ? `${Math.floor(timeAgoMs / 60_000)}m ago`
                : timeAgoMs < 86_400_000
                  ? `${Math.floor(timeAgoMs / 3600_000)}h ago`
                  : `${Math.floor(timeAgoMs / 86_400_000)}d ago`;

          let icon = WifiOff;
          if (state === "warning") icon = Package;
          else if (state === "success") icon = TrendingUp;

          return {
            icon,
            state,
            channel,
            description: alert.message,
            timeAgo,
            read: alert.resolved || false,
          };
        });

        setNotifications(mapped);
      }

      setLoading(false);
    };

    fetchAlerts();
  }, [limit]);

  return { notifications, loading, error };
}
