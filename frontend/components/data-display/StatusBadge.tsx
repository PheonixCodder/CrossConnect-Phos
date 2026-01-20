import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  status: keyof typeof STATUS_CONFIG;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  icon?: LucideIcon;
  className?: string;
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-3 py-1 text-sm gap-1.5",
  lg: "px-4 py-2 text-base gap-2",
};

export function StatusBadge({
  status,
  size = "md",
  showLabel = true,
  icon: Icon,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        sizeClasses[size],
        config.bgClass,
        "border-border/50",
        className
      )}
    >
      <div className={cn("status-dot", config.dotClass)} />
      {Icon && <Icon className="w-3 h-3" />}
      {showLabel && (
        <span className="font-medium whitespace-nowrap">
          {config.label}
        </span>
      )}
    </div>
  );
}
