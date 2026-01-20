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
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { IconType } from "react-icons/lib";

interface AlertsPanelProps {
  alerts: Database["public"]["Tables"]["alerts"]["Row"][];
  loading?: boolean;
}

const alertIcons: Record<string, IconType> = {
  inventory: Package,
  sales: TrendingUp,
  sync: WifiOff,
  fulfillment: AlertTriangle,
};

export function AlertsPanel({ alerts, loading = false }: AlertsPanelProps) {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  if (loading) {
    return (
      <div className="card-base p-5">
        {/* Skeleton logic from original component or simplified */}
        <div className="animate-pulse h-20 bg-muted rounded-md mb-4"></div>
        <div className="animate-pulse h-20 bg-muted rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Needs Attention
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {criticalCount > 0 && (
              <span className="text-xs font-medium text-red-500 px-2 py-0.5 rounded-full bg-red-500/10">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs font-medium text-yellow-500 px-2 py-0.5 rounded-full bg-yellow-500/10">
                {warningCount} warnings
              </span>
            )}
            {criticalCount === 0 && warningCount === 0 && lowCount === 0 && (
              <span className="text-xs font-medium text-green-500 px-2 py-0.5 rounded-full bg-green-500/10">
                All clear
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
          View all
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-border/50">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-medium">All systems are success</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No alerts to display
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = alertIcons[alert.alert_type] || AlertTriangle;
            // Map DB severity to Badge status
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
                  "p-4 rounded-lg border border-border/50",
                  "hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg shrink-0 bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground text-sm capitalize truncate">
                        {alert.alert_type}
                      </h3>
                      <StatusBadge status={badgeStatus} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">
                        {alert.platform} ·{" "}
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
