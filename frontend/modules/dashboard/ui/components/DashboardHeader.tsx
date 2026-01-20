"use client";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import type { TimeRange } from "../../hooks/use-dashboard-data";
import { useDashboardStore } from "@/store/useStore";

interface DashboardHeaderProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

export function DashboardHeader({ timeRange, setTimeRange }: DashboardHeaderProps) {
  const activeStore = useDashboardStore((state) => state.activeStore);

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <SidebarTrigger className="h-9 w-9 -ml-1.5" />

        <div className="flex items-center gap-3">
          <StatusBadge status="success" size="sm" />
          <span className="text-sm font-medium text-foreground">
            All Systems Operational
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium">
            {activeStore ? `Store: ${activeStore.name}` : "Viewing Org-wide metrics"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
    </header>
  );
}