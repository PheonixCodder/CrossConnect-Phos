import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  description,
  loading = false,
  className,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const trendColor = isPositive ? "text-green-500" : "text-red-500";
  const trendBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";

  if (loading) {
    return (
      <div className={cn("card-base p-6 rounded-xl shadow-sm", className)}>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "card-base p-6 rounded-xl shadow-sm group transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                trendBg,
                trendColor,
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
