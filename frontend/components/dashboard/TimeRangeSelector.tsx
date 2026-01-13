import { cn } from '@/lib/utils';
import { timeRanges } from '@/lib/mockData';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
      {timeRanges.filter(r => r.value !== 'custom').map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
            value === range.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
