import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, Store as StoreIcon } from "lucide-react";
import Image from "next/image";
import type { PlatformOverview } from "../../hooks/use-platform-overview";
import { PLATFORM_ICONS } from "../../schema/schema";

interface PlatformCardProps {
  data: PlatformOverview;
  onClick: () => void;
  loading?: boolean;
}

export function PlatformCard({ data, onClick, loading }: PlatformCardProps) {
  const isHealthy = data.activeStores > 0;
  const status = data.totalStores > 0 ? (isHealthy ? "active" : "warning") : "disconnected";

  const trend = data.trend; 
  const isPositive = trend >= 0;
  const trendColor = isPositive ? "text-green-500" : "text-red-500";
  const trendBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";

  // Formatters
  const formatNumber = (val: number) => new Intl.NumberFormat().format(val);
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  if (loading) {
    return (
      <div className="card-base p-5 animate-pulse">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded-md bg-muted" />
                <div className="h-3 w-16 rounded-md bg-muted" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-md bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 rounded-md bg-muted" />
            <div className="h-7 w-32 rounded-md bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/30">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded-md bg-muted" />
                <div className="h-4 w-12 rounded-md bg-muted" />
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
        "channel-accent relative overflow-hidden border-border/30 border"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
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
                src={PLATFORM_ICONS[data.platform] || "/images/default.svg"}
                alt={`${data.platform} logo`}
                width={24}
                height={24}
                className="relative z-10"
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground capitalize">{data.platform}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(data.lastSync)}
                </span>
              </div>
            </div>
          </div>
          <div className={cn(
             "h-2 w-2 rounded-full",
             isHealthy ? "bg-green-500" : data.totalStores > 0 ? "bg-orange-500" : "bg-gray-300"
           )} />
        </div>

        {/* Metric: Store Count (Replacing Net Sales for Integration context reliability) */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Connected Stores</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight gradient-text">
              {formatNumber(data.activeStores)} / {formatNumber(data.totalStores)}
            </span>
            {data.activeStores > 0 && (
              <div className={cn("flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500")}>
                <TrendingUp className="h-3 w-3" />
                Active
              </div>
            )}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold text-foreground">
              {formatNumber(data.totalStores)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Share</p>
            <p className="text-sm font-semibold text-foreground">
              {formatPercent(data.share)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={cn("text-sm font-semibold", isHealthy ? "text-green-600" : "text-orange-600")}>
              {isHealthy ? "Healthy" : "Check"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}