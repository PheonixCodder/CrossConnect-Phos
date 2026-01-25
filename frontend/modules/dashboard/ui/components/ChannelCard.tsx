import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/formatters";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "@/types/supabase.types";

interface Channel {
  id: string;
  name: string;
  logo: string;
  status: "success" | "warning" | "error";
  metrics: {
    netSales: number;
    orders: number;
    unitsSold: number;
    contribution: number;
    trend: number;
  };
  lastSync: string | null;
}

interface ChannelCardProps {
  channel: Channel;
  onClick: (store: Database["public"]["Tables"]["stores"]["Row"]) => void;
  loading?: boolean;
  store: Database["public"]["Tables"]["stores"]["Row"];
}

export function ChannelCard({
  channel,
  onClick,
  loading = false,
  store,
}: ChannelCardProps) {
  const trend = channel.metrics.trend;
  const isPositive = trend >= 0;
  const trendColor = isPositive ? "text-green-500" : "text-red-500";
  const trendBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";

  if (loading) {
    return (
      <div className="card-base p-6 rounded-xl shadow-sm">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "card-base p-6 rounded-xl shadow-sm cursor-pointer group transition-all hover:shadow-md",
        "relative overflow-hidden",
      )}
      onClick={() => onClick(store)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onClick?.(store)
      }
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted/50">
              <Image
                src={channel.logo}
                alt={`${channel.name} logo`}
                width={24}
                height={24}
              />
            </div>
            <div>
              <h3 className="font-semibold">{channel.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDateTime(channel.lastSync)}
              </div>
            </div>
          </div>
          <StatusBadge status={channel.status} size="sm" showLabel={false} />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Net Sales</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatCurrency(channel.metrics.netSales)}
            </span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                trendBg,
                trendColor,
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 inline mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 inline mr-0.5" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-sm font-semibold">
              {formatNumber(channel.metrics.orders)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Units</p>
            <p className="text-sm font-semibold">
              {formatNumber(channel.metrics.unitsSold)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Share</p>
            <p className="text-sm font-semibold">
              {channel.metrics.contribution.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
