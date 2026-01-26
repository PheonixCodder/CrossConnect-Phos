"use client";

import { TimeRangeSelector } from "@/modules/dashboard/ui/components/TimeRangeSelector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { useDashboardStore } from "@/store/useStore";
import { Bell } from "lucide-react";
import { NotificationsPopover } from "@/modules/dashboard/ui/components/NotificationsPopover";
import { SettingsPopover } from "@/modules/dashboard/ui/components/SettingsPopover";
import { TimeRange } from "../../hooks/use-dashboard-data";

interface DashboardHeaderProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

export function DashboardHeader({
  timeRange,
  setTimeRange,
}: DashboardHeaderProps) {
  const activeStore = useDashboardStore((state) => state.activeStore);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-8 w-8" />
        <div className="flex items-center gap-2">
          <StatusBadge status="success" size="sm" showLabel={false} />
          <span className="text-sm font-medium text-foreground">
            All Systems Operational
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
    </header>
  );
}
