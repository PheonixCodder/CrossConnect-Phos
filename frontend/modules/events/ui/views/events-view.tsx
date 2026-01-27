"use client";

import { useState } from "react";
import { Search, FilterX } from "lucide-react";
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
import { useEventsData, type EventFilters } from "@/modules/events/hooks/use-events-data";
import { EventsTable } from "../components/events-table";
import { PayloadViewerDialog } from "../components/payload-viewer-dialog";
import type { Database } from "@/types/supabase.types";

// Extract platform enum
type Platform = Database["public"]["Enums"]["platform_types"];
const PLATFORMS: Platform[] = [
  "shopify",
  "faire",
  "amazon",
  "walmart",
  "tiktok",
  "warehance",
  "target",
];

export function EventsView() {
  // --- URL State Management with nuqs ---
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    throttleMs: 500,
  });

  const [platform, setPlatform] = useQueryState("platform", {
    defaultValue: "all",
  });

  const filters: EventFilters = { search, platform };
  const { events, isLoading } = useEventsData(filters);

  const [selectedPayload, setSelectedPayload] = useState<unknown | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  const clearFilters = () => {
    setSearch("");
    setPlatform("all");
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Events</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Real time logs of incoming webhooks and platform events.
            </p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full"
            />
          </div>

          {/* Platform & Clear */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full sm:w-[180px]">
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

            {(search || platform !== "all") && (
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            Loading events...
          </div>
        ) : (
          <EventsTable
            events={events}
            onViewPayload={(payload, title) => {
              setSelectedPayload(payload);
              setSelectedTitle(title);
            }}
          />
        )}

        {/* Payload Dialog */}
        {selectedPayload !== null && (
          <PayloadViewerDialog
            open={!!selectedPayload}
            onOpenChange={() => setSelectedPayload(null)}
            payload={selectedPayload}
            title={selectedTitle}
          />
        )}
      </div>
    </PageContainer>
  );
}
