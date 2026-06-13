import { DateTime } from "luxon";
import type { Database } from "@/types/supabase.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type MetricRow = Database["public"]["Tables"]["metrics_summary"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

export const PLATFORM_ICONS: Record<string, string> = {
  amazon: "/images/amazon.svg",
  faire: "/images/faire.svg",
  shopify: "/images/shopify.svg",
  target: "/images/target.png",
  walmart: "/images/walmart.svg",
  tiktok: "/images/tiktok.svg",
  warehance: "/images/warehance.svg",
};

export interface DashboardMetricSummary {
  grossSales: number;
  totalOrders: number;
  unitsSold: number;
  avgOrderValue: number;
  cancelledCount: number;
  cancelledRevenue: number;
}

export interface StoreMetricSummary {
  storeId: string;
  sales: number;
  orders: number;
  units: number;
}

export interface ChannelViewModel {
  id: string;
  name: string;
  platform: string;
  logo: string;
  status: "success" | "warning" | "error";
  metrics: {
    netSales: number;
    grossSales: number;
    orders: number;
    unitsSold: number;
    avgOrderValue: number;
    contribution: number;
    trend: number;
  };
  lastSync: string | null;
}

export interface AlertPanelItem {
  id: string;
  alertType: string;
  message: string;
  platform: string;
  createdAt: string;
  status: "success" | "warning" | "error";
}

export type SalesTrendRow = {
  date: string;
} & Record<string, number | string>;

interface DateTimeRange {
  from: DateTime;
  to: DateTime;
}

interface DateRangeValue {
  from: Date;
  to: Date;
}

function filterMetricsByRange(
  metrics: MetricRow[],
  dateRange: DateTimeRange,
  timezone: string,
  storeId?: string,
) {
  return metrics.filter((metric) => {
    const metricDate = DateTime.fromISO(metric.date, { zone: timezone });
    const inRange = metricDate >= dateRange.from && metricDate <= dateRange.to;
    const correctStore = !storeId || metric.store_id === storeId;

    return inRange && correctStore;
  });
}

function sumMetric(metrics: MetricRow[], metricType: string) {
  return metrics
    .filter((metric) => metric.metric_type === metricType)
    .reduce((total, metric) => total + Number(metric.value ?? 0), 0);
}

export function toDashboardMetricSummary(
  metrics: MetricRow[],
  activeStoreId: string | undefined,
  dateRange: DateTimeRange,
  timezone: string,
): DashboardMetricSummary {
  if (!metrics.length) {
    return {
      grossSales: 0,
      totalOrders: 0,
      unitsSold: 0,
      avgOrderValue: 0,
      cancelledCount: 0,
      cancelledRevenue: 0,
    };
  }

  const filtered = filterMetricsByRange(
    metrics,
    dateRange,
    timezone,
    activeStoreId,
  );
  const grossSales = sumMetric(filtered, "sales");
  const totalOrders = sumMetric(filtered, "orders_count");
  const unitsSold = sumMetric(filtered, "units_sold");

  return {
    grossSales,
    totalOrders,
    unitsSold,
    avgOrderValue: totalOrders > 0 ? grossSales / totalOrders : 0,
    cancelledCount: 0,
    cancelledRevenue: 0,
  };
}

export function toStoreMetricSummaries(
  stores: StoreRow[],
  metrics: MetricRow[],
  dateRange: DateTimeRange,
  timezone: string,
): StoreMetricSummary[] {
  if (!metrics.length) return [];

  return stores.map((store) => {
    const filtered = filterMetricsByRange(
      metrics,
      dateRange,
      timezone,
      store.id,
    );
    const sales = sumMetric(filtered, "sales");
    const orders = sumMetric(filtered, "orders_count");
    const units = sumMetric(filtered, "units_sold");

    return {
      storeId: store.id,
      sales,
      orders,
      units,
    };
  });
}

export function toChannelViewModels(
  stores: StoreRow[],
  storeMetrics: StoreMetricSummary[],
): ChannelViewModel[] {
  const totalSales = storeMetrics.reduce(
    (total, metric) => total + metric.sales,
    0,
  );

  return stores.map((store) => {
    const metrics = storeMetrics.find((metric) => metric.storeId === store.id);
    const sales = metrics?.sales ?? 0;
    const orders = metrics?.orders ?? 0;
    const units = metrics?.units ?? 0;

    return {
      id: store.id,
      name: store.name,
      platform: store.platform,
      logo: PLATFORM_ICONS[store.platform] || "/images/default.svg",
      status: store.auth_status === "active" ? "success" : "error",
      metrics: {
        netSales: sales,
        grossSales: sales,
        orders,
        unitsSold: units,
        avgOrderValue: orders > 0 ? sales / orders : 0,
        contribution: totalSales > 0 ? (sales / totalSales) * 100 : 0,
        trend: 0,
      },
      lastSync: store.last_health_check || store.updated_at,
    };
  });
}

export function toSalesTrendRows(
  metrics: MetricRow[],
  dateRange: DateRangeValue,
  timezone: string,
): SalesTrendRow[] {
  const start = DateTime.fromJSDate(dateRange.from, {
    zone: timezone,
  }).startOf("day");
  const end = DateTime.fromJSDate(dateRange.to, { zone: timezone }).startOf(
    "day",
  );

  const bucket = new Map<string, SalesTrendRow>();
  let cursor = start;
  while (cursor <= end) {
    const key = cursor.toFormat("yyyy-MM-dd");
    bucket.set(key, { date: key });
    cursor = cursor.plus({ days: 1 });
  }

  metrics.forEach((metric) => {
    const date = DateTime.fromISO(metric.date, { zone: timezone }).toFormat(
      "yyyy-MM-dd",
    );
    const day = bucket.get(date);
    if (!day) return;

    const platform = metric.platform ?? "unknown";
    if (!day[platform]) day[platform] = 0;
    if (metric.metric_type === "sales") {
      (day[platform] as number) += Number(metric.value ?? 0);
    }
  });

  return Array.from(bucket.values());
}

export function toAlertPanelItems(alerts: AlertRow[]): AlertPanelItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    alertType: alert.alert_type,
    message: alert.message,
    platform: alert.platform ?? "unknown",
    createdAt: alert.created_at,
    status:
      alert.severity === "critical"
        ? "error"
        : alert.severity === "medium"
          ? "warning"
          : "success",
  }));
}
