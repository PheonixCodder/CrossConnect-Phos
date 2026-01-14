import { cn } from "@/lib/utils";
import type { ChannelStatus } from "@/lib/mockData";
import { getStatusStyles } from "@/lib/utils";

interface StatusIndicatorProps {
  status: ChannelStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = "md",
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const styles = getStatusStyles(status);

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full animate-pulse",
          styles.class,
          sizeClasses[size]
        )}
      />
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {styles.label}
        </span>
      )}
    </div>
  );
}
