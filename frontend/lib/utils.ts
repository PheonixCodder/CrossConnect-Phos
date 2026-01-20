import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChannelStatus } from "./mockData";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(text: string, max = 90) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

export const stateStyles: Record<
  "success" | "warning" | "error",
  { dot: string; bg: string }
> = {
  success: {
    dot: "bg-green-500",
    bg: "hover:bg-green-500/5",
  },
  warning: {
    dot: "bg-yellow-500",
    bg: "hover:bg-yellow-500/5",
  },
  error: {
    dot: "bg-red-500",
    bg: "hover:bg-red-500/5",
  },
};

export const statusConfig = {
  success: {
    label: "success",
    class:
      "bg-[hsl(var(--status-success))] shadow-[0 0 12px hsl(var(--status-success) / 0.6)",
  },
  warning: {
    label: "Warning",
    class:
      "bg-[hsl(var(--status-warning))] shadow-[0 0 12px hsl(var(--status-warning) / 0.6)",
  },
  error: {
    label: "Critical",
    class:
      "bg-[hsl(var(--status-error))] shadow-[0 0 12px hsl(var(--status-error) / 0.6)",
  },
};

export const getStatusStyles = (status: ChannelStatus) => statusConfig[status];
