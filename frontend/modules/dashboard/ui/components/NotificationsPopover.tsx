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
import { Notification, NotificationItem } from "./NotificationsCard";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationsPopoverProps {
  notifications: Notification[];
  className?: string;
}

export function NotificationsPopover({
  notifications,
  className,
}: NotificationsPopoverProps) {
  const unreadCount = notifications.filter((n) => n.state !== "healthy").length;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "relative h-9 w-9 rounded-lg bg-card hover:bg-muted transition-colors",
                className
              )}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-[380px] p-0 bg-popover shadow-xl border"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Mark all read
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <NotificationItem key={index} notification={notification} />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full text-sm" size="sm">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
