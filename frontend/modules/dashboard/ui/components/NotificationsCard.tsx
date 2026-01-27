import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Button } from "@/components/ui/button";

export type NotificationState = "success" | "warning" | "error";

export interface Notification {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  state: NotificationState;
  channel: string;
  description: string;
  timeAgo: string;
  read?: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss?: (id?: string) => void;
}

export function NotificationItem({
  notification,
  onDismiss,
}: NotificationItemProps) {
  const {
    icon: Icon,
    state,
    channel,
    description,
    timeAgo,
    read = false,
  } = notification;

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 group",
        !read && "bg-primary/5",
      )}
    >
      <div className="relative mt-0.5">
        <div
          className={cn(
            "p-2 rounded-lg",
            state === "error"
              ? "bg-red-500/10"
              : state === "warning"
                ? "bg-yellow-500/10"
                : "bg-green-500/10",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              state === "error"
                ? "text-red-500"
                : state === "warning"
                  ? "text-yellow-500"
                  : "text-green-500",
            )}
          />
        </div>
        {!read && (
          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium line-clamp-2">{description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StatusBadge status={state} size="sm" showLabel={false} />
              <span>{channel}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
