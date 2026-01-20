"use client";
import React, { useState } from "react";
import { Package, RefreshCw, TrendingUp, WifiOff } from "lucide-react";
import { Notification } from "@/modules/dashboard/ui/components/NotificationsCard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InlineSpinner } from "@/components/feedback/LoadingSpinner";
import { NotificationsPopover } from "@/modules/dashboard/ui/components/NotificationsPopover";
import { SettingsPopover } from "@/modules/dashboard/ui/components/SettingsPopover";

const SidebarButtons = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const notifications: Notification[] = [
    {
      icon: WifiOff,
      state: "error",
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
      state: "success",
      channel: "TikTok Shop",
      description: "Sales increased 340% in the last 2 hours.",
      timeAgo: "1h ago",
    },
  ];

  return (
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
  );
};

export default SidebarButtons;
