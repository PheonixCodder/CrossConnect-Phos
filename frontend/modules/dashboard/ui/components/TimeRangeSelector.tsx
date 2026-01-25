import { cn } from "@/lib/utils";
import { TimeRange } from "../../hooks/use-dashboard-data";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

const ranges: { label: string; value: TimeRange }[] = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "1y", value: "1y" },
];

export function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex rounded-md border overflow-hidden", className)}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors",
            value === range.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
