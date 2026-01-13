import { cn } from '@/lib/utils';
import type { ChannelStatus } from '@/lib/mockData';

interface StatusIndicatorProps {
  status: ChannelStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  healthy: {
    label: 'Healthy',
    class: 'bg-[hsl(var(--status-healthy))] shadow-[0 0 12px hsl(var(--status-healthy) / 0.6)',
  },
  warning: {
    label: 'Warning',
    class: 'bg-[hsl(var(--status-warning))] shadow-[0 0 12px hsl(var(--status-warning) / 0.6)',
  },
  critical: {
    label: 'Critical',
    class: 'bg-[hsl(var(--status-critical))] shadow-[0 0 12px hsl(var(--status-critical) / 0.6)',
  },
};

export function StatusIndicator({ status, size = 'md', showLabel = false }: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', config.class, sizeClasses[size])} />
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {config.label}
        </span>
      )}
    </div>
  );
}
