"use client";

import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Notification,
  NotificationItem,
} from "@/modules/dashboard/ui/components/NotificationsCard";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InfoState } from "@/components/layout/empty-state";

interface NotificationsPopoverProps {
  notifications: Notification[];
  className?: string;
  onMarkAllRead?: () => void;
}

export function NotificationsPopover({
  notifications,
  className,
  onMarkAllRead,
}: NotificationsPopoverProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn("relative h-8 w-8 rounded-md", className)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-96 p-0 rounded-xl shadow-lg border"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onMarkAllRead}
          >
            Mark all read
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {notifications.length === 0 ? (
              <InfoState
                title="No notifications"
                description="You're all caught up!"
                image="/images/empty.svg"
              />
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.description}
                  notification={notification}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full text-sm">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
