"use client";

import { useMemo } from "react";
import {
  parseAsString,
  useQueryState,
} from "nuqs";
import { addDays } from "date-fns";
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
import { DateRange } from "react-day-picker";

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

  /* ===========================
     ✅ REPLACED TIMERANGE SETUP
  =========================== */

  const initialDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const from = addDays(today, -7);

    return {
      from: from.toISOString(),
      to: today.toISOString(),
    };
  }, []);

  const [fromParam, setFromParam] = useQueryState(
      "from",
      parseAsString.withDefault(initialDates.from),
  );

  const [toParam, setToParam] = useQueryState(
      "to",
      parseAsString.withDefault(initialDates.to),
  );

  const dateRange: DateRange = useMemo(() => {
    return {
      from: new Date(fromParam),
      to: new Date(toParam),
    };
  }, [fromParam, toParam]);

  const setDateRange = async (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return;
    await setFromParam(range.from.toISOString());
    await setToParam(range.to.toISOString());
  };

  /* =========================== */

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
    isFetching,
    refetch
  } = useDashboardData({
    from: dateRange.from!,
    to: dateRange.to!,
  });

  const metrics = useMemo(() => {
    const cancelledOrders = orders.filter(
        (order) => order.status === "cancelled"
    );

    const validOrders = orders.filter(
        (order) => order.status !== "cancelled"
    );

    const grossSales = validOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
    );

    const totalOrders = validOrders.length;

    const cancelledCount = cancelledOrders.length;

    const cancelledRevenue = cancelledOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
    );

    const validOrderIds = new Set(validOrders.map((o) => o.id));

    const unitsSold = orderItems
        .filter((item) => validOrderIds.has(item.order_id))
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

    const avgOrderValue =
        totalOrders > 0 ? grossSales / totalOrders : 0;

    return {
      grossSales,
      totalOrders,
      unitsSold,
      avgOrderValue,
      cancelledCount,
      cancelledRevenue,
    };
  }, [orders, orderItems]);

  const storeMetrics = useMemo(() => {
    const map = new Map<string, StoreMetrics>();
    stores.forEach((store) => {
      map.set(store.id, { storeId: store.id, sales: 0, orders: 0, units: 0 });
    });
    orders.forEach((order) => {
      if (order.status === "cancelled") return;

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
    type DayBucket = {
      date: string;
      [platform: string]: number | string;
    };

    const end = dateRange.to!;
    const start = dateRange.from!;

    const buildDateRange = (s: Date, e: Date) => {
      const dates: string[] = [];
      const d = new Date(s);
      while (d <= e) {
        dates.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
      return dates;
    };

    const allDates = buildDateRange(start, end);
    const bucket = new Map<string, DayBucket>();

    allDates.forEach((date) => {
      bucket.set(date, { date });
    });

    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      if (!order.total) return;

      const date = (order.ordered_at ?? order.created_at).slice(0, 10);
      const day = bucket.get(date);
      if (!day) return;

      const platform = order.platform ?? "unknown";

      day[platform] =
          ((day[platform] as number) || 0) + order.total;
    });

    return Array.from(bucket.values());
  }, [orders, dateRange]);

  const successChannels = stores.filter(
      (s) => s.auth_status === "active",
  ).length;

  return (
    <PageContainer maxWidth="2xl" padding="lg" className="py-8 space-y-8">
      <DashboardHeader
          actions={
            <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          }
          dateRange={dateRange}
          setDateRange={setDateRange}
      />

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

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Gross Sales"
          value={formatCurrency(metrics.grossSales)}
          icon={DollarSign}
          loading={isLoading || isFetching}
        />
        <MetricCard
          title="Total Orders"
          value={formatNumber(metrics.totalOrders)}
          icon={ShoppingCart}
          loading={isLoading || isFetching}
          description="Placed orders"
        />
        <MetricCard
          title="Units Sold"
          value={formatNumber(metrics.unitsSold)}
          icon={Package}
          loading={isLoading || isFetching}
          description={
            formatNumber(metrics.unitsSold / metrics.totalOrders || 0) +
            " avg per order"
          }
        />
        <MetricCard
            title="Cancelled Orders"
            value={formatNumber(metrics.cancelledCount)}
            icon={RefreshCw}
            loading={isLoading || isFetching}
            description={
                "Lost revenue: " +
                formatCurrency(metrics.cancelledRevenue)
            }
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          icon={TrendingUp}
          loading={isLoading || isFetching}
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
                    loading={isLoading || isFetching}
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
          <AlertsPanel alerts={alerts} loading={isLoading || isFetching} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <SalesChart data={salesTrend} loading={isLoading || isFetching} />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <InventoryTable inventory={inventory} loading={isLoading || isFetching} />
      </section>

      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <OrdersTable orders={orders} loading={isLoading || isFetching} />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <ProductsTable products={products} loading={isLoading || isFetching} />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <ReturnsTable returns={returns} loading={isLoading || isFetching} />
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
