import { cn } from "@/lib/utils";
import { timeRanges } from "@/lib/mockData";
import { Calendar } from "lucide-react";

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border", className)}>
      <div className="hidden sm:flex items-center gap-1">
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
      <button
        onClick={() => onChange('custom')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
          value === 'custom'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Custom</span>
      </button>
    </div>
  );
}