"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useDashboardData, TimeRange } from "../../hooks/use-dashboard-data";
import { DashboardHeader } from "../components/DashboardHeader";
import { ChannelCard } from "../components/ChannelCard";
import { MetricCard } from "../components/MetricCard";
import { AlertsPanel } from "../components/AlertsPanel";
import { InventoryTable } from "../components/InventoryTable";
import { SalesChart } from "../components/SalesChart";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/store/useStore";

// Types
import type { StoreMetrics } from "../../hooks/use-dashboard-data";
import { ChannelStatus } from "@/lib/mockData";

// Platform Assets
const PLATFORM_ICONS: Record<string, string> = {
  amazon: "/images/amazon.svg",
  faire: "/images/faire.svg",
  shopify: "/images/shopify.svg",
  target: "/images/target.png",
  walmart: "/images/walmart.svg",
  tiktok: "/images/tiktok.svg", // Assuming you have this
  warehance: "/images/warehance.svg",
};

interface DashboardViewProps {
  userDisplayName: string | undefined;
}

export const DashboardView = ({ userDisplayName }: DashboardViewProps) => {
  const activeStore = useDashboardStore((state) => state.activeStore);

  // URL State for Time Range
  const [timeRange, setTimeRange] = useQueryState<TimeRange>("range", {
    defaultValue: "7d" as TimeRange,
  });

  const { stores, orders, orderItems, alerts, inventory, isLoading } =
    useDashboardData(timeRange);

  // --- 1. Calculate Global Metrics ---
  const metrics = useMemo(() => {
    const grossSales = orders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );
    const totalOrders = orders.length;
    const unitsSold = orderItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );
    const avgOrderValue = totalOrders > 0 ? grossSales / totalOrders : 0;

    return { grossSales, totalOrders, unitsSold, avgOrderValue };
  }, [orders, orderItems]);

  // --- 2. Calculate Per-Store Metrics (For Channel Cards) ---
  const storeMetrics = useMemo(() => {
    const map = new Map<string, StoreMetrics>();

    // Initialize with 0 for all relevant stores
    stores.forEach((store) => {
      map.set(store.id, { storeId: store.id, sales: 0, orders: 0, units: 0 });
    });

    // Add orders
    orders.forEach((order) => {
      const current = map.get(order.store_id);
      if (current) {
        current.sales += order.total || 0;
        current.orders += 1;
      }
    });

    // Add units (approximate distribution based on orders or just sum up)
    // To be accurate, we group items by order then assign to store
    const orderIdToStore = new Map(orders.map((o) => [o.id, o.store_id]));

    orderItems.forEach((item) => {
      const storeId = orderIdToStore.get(item.order_id);
      if (storeId) {
        const current = map.get(storeId);
        if (current) {
          current.units += item.quantity || 0;
        }
      }
    });

    return Array.from(map.values());
  }, [stores, orders, orderItems]);

  // --- 3. Calculate Sales Trend (For Chart) ---
  const salesTrend = useMemo(() => {
    const dataMap = new Map<string, Record<string, number>>();
    const allDates = new Set<string>();

    // Initialize dates based on range (simple approach: just extract from data)
    orders.forEach((order) => {
      const date = new Date(
        order.ordered_at || order.created_at,
      ).toLocaleDateString("en-US", { weekday: "short" });
      allDates.add(date);
      if (!dataMap.has(date)) dataMap.set(date, {});

      const dayData = dataMap.get(date)!;
      const platform = order.platform;
      dayData[platform] = (dayData[platform] || 0) + (order.total || 0);
    });

    // Convert to array
    return Array.from(allDates).map((date) => ({
      date,
      ...dataMap.get(date),
    }));
  }, [orders]);

  // --- Formatters ---
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat().format(val);

  // --- UI Logic ---
  const successChannels = stores.filter(
    (s) => s.auth_status === "active",
  ).length;
  const totalRevenue = formatCurrency(metrics.grossSales);

  return (
    <PageContainer maxWidth="2xl" padding="lg" className="py-6 space-y-6">
      <DashboardHeader timeRange={timeRange} setTimeRange={setTimeRange} />

      {/* Welcome & Summary Banner */}
      <div className="card-base p-6 bg-linear-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back, {userDisplayName}!
              </h1>
            </div>
            <p className="text-muted-foreground mb-3">
              {activeStore
                ? `Showing data for store: ${activeStore.name}. `
                : `Showing organization-wide data. `}
              Your business generated{" "}
              <span className="font-semibold text-primary">{totalRevenue}</span>{" "}
              in the selected period.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-500 border-green-500/20"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                {successChannels} of {stores.length} channels success
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-500 border-blue-500/20"
              >
                {metrics.totalOrders} orders
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gross Sales"
          value={formatCurrency(metrics.grossSales)}
          trend={14.2} // Hardcoded for visual, or calculate via previous period comparison
          icon={DollarSign}
          loading={isLoading}
          description="+12.4% vs last week"
        />
        <MetricCard
          title="Total Orders"
          value={formatNumber(metrics.totalOrders)}
          trend={8.7}
          icon={ShoppingCart}
          loading={isLoading}
          description="Total orders placed"
        />
        <MetricCard
          title="Units Sold"
          value={formatNumber(metrics.unitsSold)}
          trend={11.3}
          icon={Package}
          loading={isLoading}
          description={`${formatNumber(metrics.unitsSold / metrics.totalOrders || 0)} per order`}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          trend={5.4}
          icon={TrendingUp}
          loading={isLoading}
          description="AOV over period"
        />
      </div>

      {/* Channels + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Sales Channels
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stores.map((store) => {
              const metrics = storeMetrics.find(
                (m) => m.storeId === store.id,
              ) || { sales: 0, orders: 0, units: 0 };
              // Construct a partial channel object for the card
              const channelData = {
                id: store.id,
                name: store.name,
                platform: store.platform,
                logo: PLATFORM_ICONS[store.platform] || "/images/default.svg",
                status: (store.auth_status === "active"
                  ? "success"
                  : "error") as ChannelStatus,
                metrics: {
                  netSales: metrics.sales,
                  grossSales: metrics.sales,
                  orders: metrics.orders,
                  unitsSold: metrics.units,
                  avgOrderValue:
                    metrics.sales > 0 ? metrics.sales / metrics.orders : 0,
                  contribution: 0, // Calculate if needed
                  trend: 0,
                },
                lastSync: store.last_health_check || store.updated_at,
              };

              return (
                <ChannelCard
                  key={store.id}
                  channel={channelData}
                  onClick={() => {
                    /* Navigate to store details if needed */
                  }}
                  loading={isLoading}
                />
              );
            })}
          </div>
        </div>

        <AlertsPanel alerts={alerts} loading={isLoading} />
      </div>

      {/* Chart + Inventory */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart data={salesTrend} loading={isLoading} />
        <InventoryTable inventory={inventory} loading={isLoading} />
      </div>
    </PageContainer>
  );
};
