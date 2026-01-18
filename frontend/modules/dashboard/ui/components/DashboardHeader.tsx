/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import {
  RefreshCw,
  Settings,
  Bell,
  WifiOff,
  Package,
  TrendingUp,
} from "lucide-react";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "../../../../components/ui/sidebar";
import { Badge } from "../../../../components/ui/badge";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { NotificationsPopover } from "./NotificationsPopover";
import type { Notification } from "./NotificationsCard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InlineSpinner } from "@/components/feedback/LoadingSpinner";
import { formatTimeAgo } from "@/lib/mockData";
import { SettingsPopover } from "./SettingsPopover";

export function DashboardHeader() {
  const [timeRange, setTimeRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  useEffect(() => {
    setLastSyncTime(formatTimeAgo(new Date(Date.now() - 120000)));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const notifications: Notification[] = [
    {
      icon: WifiOff,
      state: "critical",
      channel: "Target",
      description: "API Sync Failed. Target API connection timed out.",
      timeAgo: "15m ago",
    },
    {
      icon: Package,
      state: "warning",
      channel: "All Channels",
      description: 'SKU-2847 "Premium Widget Pro" has only 12 units remaining.',
      timeAgo: "30m ago",
    },
    {
      icon: TrendingUp,
      state: "healthy",
      channel: "TikTok Shop",
      description: "Sales increased 340% in the last 2 hours.",
      timeAgo: "1h ago",
    },
  ];

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <SidebarTrigger className="h-9 w-9 -ml-1.5" />

        <div className="flex items-center gap-3">
          <StatusBadge status="healthy" size="sm" />
          <span className="text-sm font-medium text-foreground">
            All Systems Operational
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium">
            Last sync: {lastSyncTime}
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-xs font-medium bg-primary/5"
          >
            Next sync: 58 seconds
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className="h-9 w-9 rounded-lg bg-card hover:bg-muted transition-colors"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <InlineSpinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh Data</TooltipContent>
          </Tooltip>

          <NotificationsPopover notifications={notifications} />

          <SettingsPopover />
        </div>
      </div>
    </header>
  );
}
