import { cn } from '@/lib/utils';
import { StatusIndicator } from './StatusIndicator';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { Channel } from '@/lib/mockData';
import { formatCurrency, formatNumber, formatPercent, formatTimeAgo } from '@/lib/mockData';
import Image from 'next/image';

interface ChannelCardProps {
  channel: Channel;
  onClick?: () => void;
}

export function ChannelCard({ channel, onClick }: ChannelCardProps) {
  const trend = channel.metrics.trend;
  const isPositive = trend >= 0;

  return (
    <div
      className={cn(
        'bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-300 shadow-(--shadow-card) hover:border-primary/30 hover:shadow-(--shadow-glow) p-5 cursor-pointer group',
        channel.colorClass,
        'channel-accent'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image src={channel.logo} alt='img' width={30} height={30} className="" />
          <div>
            <h3 className="font-semibold text-foreground">{channel.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(channel.lastSync)}
              </span>
            </div>
          </div>
        </div>
        <StatusIndicator status={channel.status} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Net Sales</p>
          <div className="flex items-baseline gap-2">
            <span className="font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-2xl">
              {formatCurrency(channel.metrics.netSales)}
            </span>
            <div className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              isPositive ? 'text-[hsl(var(--status-healthy))]' : 'text-[hsl(var(--status-critical))]'
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
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
