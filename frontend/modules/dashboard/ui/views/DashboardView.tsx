"use client";

import { useMemo } from "react";
import {
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { DashboardHeader } from "@/modules/dashboard/ui/components/DashboardHeader";
import { ChannelCard } from "@/modules/dashboard/ui/components/ChannelCard";
import { MetricCard } from "@/modules/dashboard/ui/components/MetricCard";
import { AlertsPanel } from "@/modules/dashboard/ui/components/AlertsPanel";
import { SalesChart } from "@/modules/dashboard/ui/components/SalesChart";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { ChannelStatus } from "@/lib/mockData";
import {
  StoreMetrics,
  TimeRange,
  useDashboardData,
} from "../../hooks/use-dashboard-data";
import { OrdersTable } from "../components/orders-table";
import { ProductsTable } from "../components/products-table";
import { ReturnsTable } from "../components/returns-table";
import { OrderDialog } from "../components/order-dialog";
import { ProductDialog } from "../components/product-dialog";
import { ReturnDialog } from "../components/return-dialog";
import { InfoState } from "@/components/layout/empty-state";
import { Card } from "@/components/ui/card";
import { InventoryTable } from "../components/inventory-table";
import { Database } from "@/types/supabase.types";

// Platform Assets
const PLATFORM_ICONS: Record<string, string> = {
  amazon: "/images/amazon.svg",
  faire: "/images/faire.svg",
  shopify: "/images/shopify.svg",
  target: "/images/target.png",
  walmart: "/images/walmart.svg",
  tiktok: "/images/tiktok.svg",
  warehance: "/images/warehance.svg",
};

interface DashboardViewProps {
  userDisplayName: string | undefined;
}

export const DashboardView = ({ userDisplayName }: DashboardViewProps) => {
  const activeStore = useDashboardStore((state) => state.activeStore);
  const setActiveStore = useDashboardStore((state) => state.setActiveStore);

  const onChannelClick = (
    store: Database["public"]["Tables"]["stores"]["Row"],
  ) => {
    setActiveStore(store);
  };
  const timeRangeValues = ["7d", "30d", "90d", "1y"] as const;

  const [timeRange, setTimeRange] = useQueryState<TimeRange>(
    "range",
    parseAsStringLiteral(timeRangeValues).withDefault("7d"),
  );

  const [orderId, setOrderId] = useQueryState("order");
  const [productId, setProductId] = useQueryState("product");
  const [returnId, setReturnId] = useQueryState("return");

  const {
    stores,
    orders,
    orderItems,
    alerts,
    inventory,
    products,
    returns,
    isLoading,
  } = useDashboardData(timeRange);

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

  const storeMetrics = useMemo(() => {
    const map = new Map<string, StoreMetrics>();
    stores.forEach((store) => {
      map.set(store.id, { storeId: store.id, sales: 0, orders: 0, units: 0 });
    });
    orders.forEach((order) => {
      const current = map.get(order.store_id);
      if (current) {
        current.sales += order.total || 0;
        current.orders += 1;
      }
    });
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

  const salesTrend = useMemo(() => {
    const dataMap = new Map<string, Record<string, number>>();
    const allDates = new Set<string>();
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
    return Array.from(allDates).map((date) => ({ date, ...dataMap.get(date) }));
  }, [orders]);

  const successChannels = stores.filter(
    (s) => s.auth_status === "active",
  ).length;

  return (
    <PageContainer maxWidth="2xl" padding="lg" className="py-8 space-y-8">
      <DashboardHeader timeRange={timeRange} setTimeRange={setTimeRange} />

      <section className="card-base p-6 rounded-xl shadow-sm bg-linear-to-r from-primary/5 to-transparent">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Welcome back, {userDisplayName}!
            </h1>
            <p className="text-muted-foreground mb-4">
              {activeStore
                ? `Viewing store: ${activeStore.name}`
                : "Organization-wide overview"}
              . Generated {formatCurrency(metrics.grossSales)} in selected
              period.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="bg-green-500/10 text-green-600"
              >
                {successChannels} / {stores.length} channels active
              </Badge>
              <Badge
                variant="secondary"
                className="bg-blue-500/10 text-blue-600"
              >
                {metrics.totalOrders} orders
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gross Sales"
          value={formatCurrency(metrics.grossSales)}
          trend={14.2}
          icon={DollarSign}
          loading={isLoading}
          description="+12.4% vs last period"
        />
        <MetricCard
          title="Total Orders"
          value={formatNumber(metrics.totalOrders)}
          trend={8.7}
          icon={ShoppingCart}
          loading={isLoading}
          description="Placed orders"
        />
        <MetricCard
          title="Units Sold"
          value={formatNumber(metrics.unitsSold)}
          trend={11.3}
          icon={Package}
          loading={isLoading}
          description={
            formatNumber(metrics.unitsSold / metrics.totalOrders || 0) +
            " avg per order"
          }
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          trend={5.4}
          icon={TrendingUp}
          loading={isLoading}
          description="AOV"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        {!activeStore && (
          <div className="lg:col-span-8">
            <h2 className="text-lg font-semibold mb-4">Sales Channels</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => {
                const sm = storeMetrics.find((m) => m.storeId === store.id) || {
                  sales: 0,
                  orders: 0,
                  units: 0,
                };
                const channelData = {
                  id: store.id,
                  name: store.name,
                  platform: store.platform,
                  logo: PLATFORM_ICONS[store.platform] || "/images/default.svg",
                  status: (store.auth_status === "active"
                    ? "success"
                    : "error") as ChannelStatus,
                  metrics: {
                    netSales: sm.sales,
                    grossSales: sm.sales,
                    orders: sm.orders,
                    unitsSold: sm.units,
                    avgOrderValue: sm.orders > 0 ? sm.sales / sm.orders : 0,
                    contribution: 0,
                    trend: 0,
                  },
                  lastSync: store.last_health_check || store.updated_at,
                };
                return (
                  <ChannelCard
                    key={store.id}
                    channel={channelData}
                    loading={isLoading}
                    onClick={onChannelClick}
                    store={store}
                  />
                );
              })}
            </div>
            {stores.length === 0 && (
              <Card className="flex justify-center items-center w-full">
                <InfoState
                  title="No Stores"
                  description="You have not connected any stores yet"
                />
              </Card>
            )}
          </div>
        )}
        <div className={cn("lg:col-span-4", activeStore && "lg:col-span-12")}>
          <AlertsPanel alerts={alerts} loading={isLoading} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <SalesChart data={salesTrend} loading={isLoading} />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <InventoryTable inventory={inventory} loading={isLoading} />
      </section>

      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <OrdersTable orders={orders} loading={isLoading} />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <ProductsTable products={products} loading={isLoading} />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <ReturnsTable returns={returns} loading={isLoading} />
      </section>

      {orderId && (
        <OrderDialog
          open={!!orderId}
          onOpenChange={(o) => setOrderId(o ? orderId : null)}
          orderId={orderId}
        />
      )}
      {productId && (
        <ProductDialog
          open={!!productId}
          onOpenChange={(o) => setProductId(o ? productId : null)}
          productId={productId}
        />
      )}
      {returnId && (
        <ReturnDialog
          open={!!returnId}
          onOpenChange={(o) => setReturnId(o ? returnId : null)}
          returnId={returnId}
        />
      )}
    </PageContainer>
  );
};
