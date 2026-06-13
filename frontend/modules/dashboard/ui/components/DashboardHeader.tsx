"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { type DateRange } from "react-day-picker";
import { DateRangePicker } from "@/modules/dashboard/ui/components/TimeRangeSelector";

interface DashboardHeaderProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  actions: React.ReactNode;
}

export function DashboardHeader({
  dateRange,
  setDateRange,
  actions,
}: DashboardHeaderProps) {
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
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        {actions}
      </div>
    </header>
  );
}
