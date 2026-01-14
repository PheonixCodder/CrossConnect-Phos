import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  WifiOff,
  Package,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import type { Alert } from "@/lib/mockData";
import { formatTimeAgo } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

interface AlertsPanelProps {
  alerts: Alert[];
  loading?: boolean;
}

const alertIcons = {
  inventory: Package,
  sales: TrendingUp,
  sync: WifiOff,
  fulfillment: AlertTriangle,
};

export function AlertsPanel({ alerts, loading = false }: AlertsPanelProps) {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  if (loading) {
    return (
      <div className="card-base p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-48 rounded-md bg-muted animate-pulse" />
            </div>
            <div className="h-4 w-12 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded-md bg-muted animate-pulse" />
                    <div className="h-3 w-full rounded-md bg-muted animate-pulse" />
                    <div className="h-3 w-24 rounded-md bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
            {criticalCount === 0 && warningCount === 0 && (
              <span className="text-xs font-medium text-green-500 px-2 py-0.5 rounded-full bg-green-500/10">
                All clear
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2"
        >
          View all
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-border/50">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-medium">All systems are healthy</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No alerts to display
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = alertIcons[alert.type];
            const severityColor =
              alert.severity === "critical"
                ? "text-red-500"
                : alert.severity === "warning"
                ? "text-yellow-500"
                : "text-green-500";
            const severityBg =
              alert.severity === "critical"
                ? "bg-red-500/10"
                : alert.severity === "warning"
                ? "bg-yellow-500/10"
                : "bg-green-500/10";

            return (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-lg border border-border/50",
                  "hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg shrink-0", severityBg)}>
                    <Icon className={cn("h-4 w-4", severityColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground text-sm truncate">
                        {alert.title}
                      </h3>
                      <StatusBadge status={alert.severity} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {alert.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {alert.channel} · {formatTimeAgo(alert.timestamp)}
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