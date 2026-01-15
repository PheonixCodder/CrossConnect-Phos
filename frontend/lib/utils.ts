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
  "healthy" | "warning" | "critical",
  { dot: string; bg: string }
> = {
  healthy: {
    dot: "bg-green-500",
    bg: "hover:bg-green-500/5",
  },
  warning: {
    dot: "bg-yellow-500",
    bg: "hover:bg-yellow-500/5",
  },
  critical: {
    dot: "bg-red-500",
    bg: "hover:bg-red-500/5",
  },
};

export const statusConfig = {
  healthy: {
    label: "Healthy",
    class:
      "bg-[hsl(var(--status-healthy))] shadow-[0 0 12px hsl(var(--status-healthy) / 0.6)",
  },
  warning: {
    label: "Warning",
    class:
      "bg-[hsl(var(--status-warning))] shadow-[0 0 12px hsl(var(--status-warning) / 0.6)",
  },
  critical: {
    label: "Critical",
    class:
      "bg-[hsl(var(--status-critical))] shadow-[0 0 12px hsl(var(--status-critical) / 0.6)",
  },
};

export const getStatusStyles = (status: ChannelStatus) => statusConfig[status];
