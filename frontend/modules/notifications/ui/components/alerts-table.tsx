"use client";

import { ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AlertWithStore } from "../../hooks/use-alerts-data";
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

interface AlertsTableProps {
  alerts: AlertWithStore[];
  onViewDetails: (alert: AlertWithStore) => void;
}

// Helper for severity styling
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30";
    case "medium":
      return "text-yellow-700 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-500 dark:border-yellow-900/30";
    case "low":
    default:
      return "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30";
  }
};

export function AlertsTable({ alerts, onViewDetails }: AlertsTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
        No alerts found matching your filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow 
              key={alert.id}
              className={cn(
                "group",
                !alert.resolved && "bg-muted/30"
              )}
            >
              <TableCell className="text-muted-foreground text-xs w-[140px]">
                <div title={alert.created_at}>
                  {formatDistanceToNow(new Date(alert.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={cn("capitalize font-medium text-[10px]", getSeverityColor(alert.severity))}
                >
                  {alert.severity}
                </Badge>
              </TableCell>
              
              <TableCell className="font-medium text-xs">
                {alert.alert_type}
              </TableCell>
              
              <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                {alert.message}
              </TableCell>
              
              <TableCell className="text-muted-foreground text-xs">
                {alert.stores?.name || "Unknown"}
              </TableCell>

              <TableCell>
                {alert.resolved ? (
                   <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                   <AlertTriangle className="h-4 w-4 text-orange-600" />
                )}
              </TableCell>

              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onViewDetails(alert)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}