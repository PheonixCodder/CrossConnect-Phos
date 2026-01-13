import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  description,
  className 
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className={cn('bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl p-5 shadow-card', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            isPositive 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-red-500/10 text-red-500'
          )}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">{value}</p>
      
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
