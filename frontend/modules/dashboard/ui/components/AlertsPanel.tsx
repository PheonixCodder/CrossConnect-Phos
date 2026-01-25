import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  WifiOff,
  Package,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import type { Database } from "@/types/supabase.types";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { DataTableSkeleton } from "@/components/data-display/data-table-skeleton";
import { Badge } from "@/components/ui/badge";
import { InfoState } from "@/components/layout/empty-state";

type Alert = Database["public"]["Tables"]["alerts"]["Row"];

const alertIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  inventory: Package,
  sales: TrendingUp,
  sync: WifiOff,
  fulfillment: AlertTriangle,
};

interface AlertsPanelProps {
  alerts: Alert[];
  loading?: boolean;
}

export function AlertsPanel({ alerts, loading = false }: AlertsPanelProps) {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  if (loading) {
    return <DataTableSkeleton rows={5} />;
  }

  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Needs Attention</h2>
          <div className="flex items-center gap-2 mt-1">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {criticalCount} critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" className="rounded-full">
                {warningCount} warnings
              </Badge>
            )}
            {criticalCount === 0 && warningCount === 0 && lowCount === 0 && (
              <Badge variant="success" className="rounded-full">
                All clear
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          View all
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <InfoState
            title="All systems good"
            description="No alerts to display."
            image="/images/empty.svg"
          />
        ) : (
          alerts.map((alert) => {
            const Icon = alertIcons[alert.alert_type] || AlertTriangle;
            const badgeStatus =
              alert.severity === "critical"
                ? "error"
                : alert.severity === "medium"
                  ? "warning"
                  : "success";

            return (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold capitalize">
                        {alert.alert_type}
                      </h3>
                      <StatusBadge status={badgeStatus} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">
                        {alert.platform} · {formatDateTime(alert.created_at)}
                      </span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
