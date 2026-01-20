"use client";

import { Eye, ChevronRight, LucideIcon } from "lucide-react";
import type { EventWithStore } from "../../hooks/use-events-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Simple icon mapper for platforms
const iconMap: Record<string, LucideIcon> = {};

interface EventsTableProps {
  events: EventWithStore[];
  onViewPayload: (payload: unknown, title: string) => void;
}

export function EventsTable({ events, onViewPayload }: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
        No events found matching your filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Event Type</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Store</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="text-muted-foreground text-xs w-[180px]">
                <div title={event.created_at}>
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize font-mono text-[10px]">
                  {event.event_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {event.platform}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-sm">{event.entity}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    ID: {event.external_event_id}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {event.stores?.name || "Unknown Store"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewPayload(event.payload, event.external_event_id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Payload
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}