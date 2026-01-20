"use client";

import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Clock, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import type { AlertWithStore } from "../../hooks/use-alerts-data";

// Helper for severity colors
const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive";
    case "high":
      return "destructive"; // You might want a custom "red" variant
    case "medium":
      return "secondary"; // Or yellow
    case "low":
      return "outline";
    default:
      return "outline";
  }
};

interface AlertDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: AlertWithStore | null;
}

export function AlertDetailsDialog({
  open,
  onOpenChange,
  alert,
}: AlertDetailsDialogProps) {
  if (!alert) return null;

  return (
    <ResponsiveDialog
      title="Alert Details"
      description={`ID: ${alert.id}`}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-4 mt-4">
        {/* Status Row */}
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {alert.resolved ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-orange-600" />
              )}
              <span className="font-medium">
                {alert.resolved ? "Resolved" : "Open"}
              </span>
            </div>
          </div>
          <Badge variant={getSeverityVariant(alert.severity)} className="capitalize">
            {alert.severity}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Platform</span>
            <span className="font-medium capitalize">{alert.platform}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Store</span>
            <span className="font-medium">{alert.stores?.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Alert Type</span>
            <span className="font-medium">{alert.alert_type}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Related Entity</span>
            <span className="font-mono text-xs">
              {alert.related_entity_id || "N/A"}
            </span>
          </div>
        </div>

        <Separator />

        {/* Message Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4" />
            Message
          </div>
          <div className="rounded-md border bg-background p-4 text-sm">
            {alert.message}
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Clock className="h-3 w-3" />
          <span>
            Created at{" "}
            {format(new Date(alert.created_at), "MMM d, yyyy, HH:mm:ss")}
          </span>
        </div>
      </div>
    </ResponsiveDialog>
  );
}