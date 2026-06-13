"use client";

import { useMemo } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { DateTime } from "luxon";
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
import { useDashboardData } from "../../hooks/use-dashboard-data";
import { OrdersTable } from "../components/orders-table";
import { ProductsTable } from "../components/products-table";
import { ReturnsTable } from "../components/returns-table";
import { OrderDialog } from "../components/order-dialog";
import { ProductDialog } from "../components/product-dialog";
import { ReturnDialog } from "../components/return-dialog";
import { InfoState } from "@/components/layout/empty-state";
import { Card } from "@/components/ui/card";
import { InventoryTable } from "../components/inventory-table";
import { DateRange } from "react-day-picker";
import {
  toInventoryTableRows,
  toOrderTableRows,
  toProductTableRows,
  toReturnTableRows,
} from "../../domain/product-view-models";
import {
  toAlertPanelItems,
  toChannelViewModels,
  toDashboardMetricSummary,
  toSalesTrendRows,
  toStoreMetricSummaries,
} from "../../domain/summary-view-models";

interface DashboardViewProps {
  userDisplayName: string | undefined;
}

export const DashboardView = ({ userDisplayName }: DashboardViewProps) => {
  const activeStore = useDashboardStore((state) => state.activeStore);
  const setActiveStore = useDashboardStore((state) => state.setActiveStore);
  const STORE_TZ = "America/Los_Angeles";

  const initialDates = useMemo(() => {
    const todayPacific = DateTime.now()
      .setZone("America/Los_Angeles")
      .startOf("day");

    const fromPacific = todayPacific.minus({ days: 7 });

    return {
      from: fromPacific.toISO(),
      to: todayPacific.toISO(),
    };
  }, []);

  const [fromParam, setFromParam] = useQueryState(
    "from",
    parseAsString.withDefault(initialDates.from!),
  );

  const [toParam, setToParam] = useQueryState(
    "to",
    parseAsString.withDefault(initialDates.to!),
  );

  const dateRange = useMemo(() => {
    return {
      from: DateTime.fromISO(fromParam, { zone: STORE_TZ }).toJSDate(),
      to: DateTime.fromISO(toParam, { zone: STORE_TZ }).toJSDate(),
    };
  }, [fromParam, toParam]);

  const dateRangeTrends = useMemo(() => {
    const from = DateTime.fromISO(fromParam, { zone: STORE_TZ }).startOf("day");

    const to = DateTime.fromISO(toParam, { zone: STORE_TZ }).endOf("day");

    return {
      from,
      to,
    };
  }, [fromParam, toParam]);

  const setDateRange = async (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return;
    await setFromParam(range.from.toISOString());
    await setToParam(range.to.toISOString());
  };

  const [orderId, setOrderId] = useQueryState("order");
  const [productId, setProductId] = useQueryState("product");
  const [returnId, setReturnId] = useQueryState("return");

  const {
    stores,
    orders,
    alerts,
    inventory,
    products,
    returns,
    isLoading,
    metrics: metricsSummary,
    isFetching,
    refetch,
  } = useDashboardData({
    from: dateRange.from!,
    to: dateRange.to!,
  });

  const onChannelClick = (storeId: string) => {
    const store = stores.find((candidate) => candidate.id === storeId);
    if (store) setActiveStore(store);
  };

  const metrics = useMemo(
    () =>
      toDashboardMetricSummary(
        metricsSummary,
        activeStore?.id,
        dateRangeTrends,
        STORE_TZ,
      ),
    [metricsSummary, activeStore?.id, dateRangeTrends],
  );

  const storeMetrics = useMemo(
    () =>
      toStoreMetricSummaries(stores, metricsSummary, dateRangeTrends, STORE_TZ),
    [stores, metricsSummary, dateRangeTrends],
  );

  const salesTrend = useMemo(
    () => toSalesTrendRows(metricsSummary, dateRange, STORE_TZ),
    [metricsSummary, dateRange],
  );

  const inventoryRows = useMemo(
    () => toInventoryTableRows(inventory),
    [inventory],
  );
  const orderRows = useMemo(() => toOrderTableRows(orders), [orders]);
  const productRows = useMemo(() => toProductTableRows(products), [products]);
  const returnRows = useMemo(() => toReturnTableRows(returns), [returns]);
  const alertRows = useMemo(() => toAlertPanelItems(alerts), [alerts]);
  const channelRows = useMemo(
    () => toChannelViewModels(stores, storeMetrics),
    [stores, storeMetrics],
  );

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
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
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
            "Lost revenue: " + formatCurrency(metrics.cancelledRevenue)
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
              {channelRows.map((channel) => {
                return (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    loading={isLoading || isFetching}
                    onClick={onChannelClick}
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
          <AlertsPanel alerts={alertRows} loading={isLoading || isFetching} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <SalesChart data={salesTrend} loading={isLoading || isFetching} />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <InventoryTable
          inventory={inventoryRows}
          loading={isLoading || isFetching}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <OrdersTable
          orders={orderRows.filter((f) => {
            const metricDate = DateTime.fromISO(f.orderedAt!, {
              zone: STORE_TZ,
            });

            const inRange =
              metricDate >= dateRangeTrends.from &&
              metricDate <= dateRangeTrends.to;

            return inRange;
          })}
          loading={isLoading || isFetching}
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <ProductsTable
          products={productRows}
          loading={isLoading || isFetching}
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-1 overflow-scroll [&::-webkit-scrollbar]:hidden">
        <ReturnsTable returns={returnRows} loading={isLoading || isFetching} />
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
