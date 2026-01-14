import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import type { Channel } from "@/lib/mockData";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatTimeAgo,
} from "@/lib/mockData";
import Image from "next/image";

interface ChannelCardProps {
  channel: Channel;
  onClick?: () => void;
  loading?: boolean;
}

export function ChannelCard({
  channel,
  onClick,
  loading = false,
}: ChannelCardProps) {
  const trend = channel.metrics.trend;
  const isPositive = trend >= 0;
  const trendColor = isPositive ? "text-green-500" : "text-red-500";
  const trendBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";

  if (loading) {
    return (
      <div className="card-base p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded-md bg-muted animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 rounded-md bg-muted animate-pulse" />
            <div className="h-7 w-32 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/30">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded-md bg-muted animate-pulse" />
                <div className="h-4 w-12 rounded-md bg-muted animate-pulse" />
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
        "card-base card-hover p-5 cursor-pointer group",
        "channel-accent relative overflow-hidden",
        `channel-border-amazon`,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
          e.preventDefault();
        }
      }}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-current/10 rounded-lg" />
              <Image
                src={channel.logo}
                alt={`${channel.name} logo`}
                width={24}
                height={24}
                className="relative z-10"
                loading="lazy"
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{channel.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(channel.lastSync)}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={channel.status} size="sm" showLabel={false} />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Net Sales</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight gradient-text">
              {formatCurrency(channel.metrics.netSales)}
            </span>
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                trendBg,
                trendColor
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercent(trend)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-sm font-semibold text-foreground">
              {formatNumber(channel.metrics.orders)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Units</p>
            <p className="text-sm font-semibold text-foreground">
              {formatNumber(channel.metrics.unitsSold)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Share</p>
            <p className="text-sm font-semibold text-foreground">
              {channel.metrics.contribution.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
