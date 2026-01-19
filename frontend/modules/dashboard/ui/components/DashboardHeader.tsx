/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "../../../../components/ui/sidebar";
import { Badge } from "../../../../components/ui/badge";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatTimeAgo } from "@/lib/mockData";

export function DashboardHeader() {
  const [timeRange, setTimeRange] = useState("7d");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  useEffect(() => {
    setLastSyncTime(formatTimeAgo(new Date(Date.now() - 120000)));
  }, []);

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
      </div>
    </header>
  );
}
