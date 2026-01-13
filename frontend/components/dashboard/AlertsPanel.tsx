import { cn } from '@/lib/utils';
import { AlertTriangle, WifiOff, Package, TrendingUp, ChevronRight } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import type { Alert } from '@/lib/mockData';
import { formatTimeAgo } from '@/lib/mockData';

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertIcons = {
  inventory: Package,
  sales: TrendingUp,
  sync: WifiOff,
  fulfillment: AlertTriangle,
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className=" p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Needs Attention</h2>
          <p className="text-sm text-muted-foreground">
            {criticalCount > 0 && (
              <span className="text-red-500">{criticalCount} critical</span>
            )}
            {criticalCount > 0 && warningCount > 0 && ' · '}
            {warningCount > 0 && (
              <span className="text-yellow-500">{warningCount} warnings</span>
            )}
          </p>
        </div>
        <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View all
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          return (
            <div
              key={alert.id}
              className={cn(
                'p-4 rounded-lg border border-border/50 bg-card/50',
                'hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg shrink-0',
                  alert.severity === 'critical' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                )}>
                  <Icon className={cn(
                    'w-4 h-4',
                    alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {alert.title}
                    </h3>
                    <StatusIndicator status={alert.severity} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {alert.channel} · {formatTimeAgo(alert.timestamp)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
