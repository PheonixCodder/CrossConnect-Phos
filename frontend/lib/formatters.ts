import { formatDistanceToNow, parseISO, format } from "date-fns";

// lib/formatters.ts
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "N/A";

  try {
    const date = parseISO(dateString);
    // Returns: "Oct 24, 2023, 2:30 PM"
    return format(date, "MMM d, yyyy, h:mm a");
  } catch (error) {
    return "Invalid Date";
  }
}


export function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
