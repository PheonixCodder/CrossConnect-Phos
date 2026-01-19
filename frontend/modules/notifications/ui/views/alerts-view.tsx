"use client";

import { useState } from "react";
import { Search, FilterX, Bell } from "lucide-react";
import { useQueryState } from "nuqs";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertWithStore,
  useAlertsData,
  type AlertFilters,
} from "../../hooks/use-alerts-data";
import { AlertsTable } from "../components/alerts-table";
import { AlertDetailsDialog } from "../components/alert-details-dialog";
import type { Database } from "@/types/supabase.types";

// Extract Enums from Database
type Platform = Database["public"]["Enums"]["platform_types"];
type Severity = Database["public"]["Enums"]["alert_severity"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"];

const PLATFORMS: Platform[] = [
  "shopify",
  "faire",
  "amazon",
  "walmart",
  "tiktok",
  "warehance",
  "target",
];

const SEVERITY: Severity[] = ["low", "medium", "high", "critical"];

export function AlertsView() {
  // --- URL State Management with nuqs ---
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    throttleMs: 500,
  });

  const [platform, setPlatform] = useQueryState("platform", {
    defaultValue: "all",
  });

  const [severity, setSeverity] = useQueryState("severity", {
    defaultValue: "all",
  });

  const [resolved, setResolved] = useQueryState("resolved", {
    defaultValue: "all", // "all" | "open" | "resolved"
  });

  // Prepare filters object
  const filters: AlertFilters = { search, platform, severity, resolved };

  // --- Fetch & Filter ---
  const { alerts, isLoading } = useAlertsData(filters);

  // --- Dialog State ---
  const [selectedAlert, setSelectedAlert] = useState<null | AlertWithStore>(
    null,
  ); // Using 'any' for AlertWithStore type to simplify circular deps in this example, replace with specific type
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewDetails = (alert: AlertWithStore) => {
    setSelectedAlert(alert);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setPlatform("all");
    setSeverity("all");
    setResolved("all");
  };

  const hasActiveFilters =
    search || platform !== "all" || severity !== "all" || resolved !== "all";

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Alerts</h2>
              <p className="text-muted-foreground">
                Monitor system alerts, inventory issues, and platform
                notifications.
              </p>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 justify-between">
          <div className="flex items-center gap-2 w-full xl:w-auto flex-1">
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by type or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            {/* Platform Filter */}
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {SEVERITY.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Resolved Filter */}
            <Select value={resolved} onValueChange={setResolved}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            Loading alerts...
          </div>
        ) : (
          <AlertsTable alerts={alerts} onViewDetails={handleViewDetails} />
        )}

        {/* Alert Details Dialog */}
        <AlertDetailsDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          alert={selectedAlert}
        />
      </div>
    </PageContainer>
  );
}
