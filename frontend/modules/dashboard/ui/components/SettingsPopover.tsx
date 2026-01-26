"use client";

import { Settings } from "lucide-react";
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
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SettingsPopover() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "relative h-9 w-9 rounded-lg bg-card hover:bg-muted transition-colors"
              )}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Settings</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-[100px] p-0 shadow-xl border-0 bg-transparent"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Link className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all p-1.5" href={'/settings'}>Settings</Link>
          <Button variant={'secondary'} className="w-full">Logout</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
