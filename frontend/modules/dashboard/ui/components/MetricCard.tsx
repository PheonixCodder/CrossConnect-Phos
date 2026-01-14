import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  description,
  className,
  loading = false,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const trendColor = isPositive ? "text-green-500" : "text-red-500";
  const trendBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";

  return (
    <div
      className={cn(
        "card-base card-hover p-5 relative overflow-hidden",
        "group transition-all duration-300",
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          {trend !== undefined && !loading && (
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                trendBg,
                trendColor
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}

          {loading && (
            <div className="h-6 w-16 rounded-md bg-muted animate-pulse" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>

          {loading ? (
            <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
          ) : (
            <p className="text-3xl font-bold tracking-tight gradient-text">
              {value}
            </p>
          )}
        </div>

        {description && !loading && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
