"use client";

import { useState, Suspense } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  channels,
  alerts,
  inventoryItems,
  getTotalMetrics,
  formatCurrency,
  formatNumber,
} from "@/lib/mockData";

import { DashboardHeader } from "../components/DashboardHeader";
import { ChannelCard } from "../components/ChannelCard";
import { MetricCard } from "../components/MetricCard";
import { AlertsPanel } from "../components/AlertsPanel";
import { InventoryTable } from "../components/InventoryTable";
import { SalesChart } from "../components/SalesChart";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardViewProps {
  userDisplayName: string | undefined;
}

export const DashboardView = ({ userDisplayName }: DashboardViewProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const totals = getTotalMetrics();
  const avgOrderValue =
    totals.orders > 0 ? totals.grossSales / totals.orders : 0;
  const healthyChannels = channels.filter((c) => c.status === "healthy").length;
  const totalRevenue = formatCurrency(totals.grossSales);

  const handleRefreshAll = () => {
    setIsLoading(true);
    // In a real app, you might use router.refresh() here
    // to re-run the server component's data fetching.
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <PageContainer maxWidth="2xl" padding="lg" className="py-6 space-y-6">
      <DashboardHeader />

      {/* Welcome & Summary Banner */}
      <div className="card-base card-hover p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back, {userDisplayName}!
              </h1>
            </div>
            <p className="text-muted-foreground mb-3">
              Your business generated{" "}
              <span className="font-semibold text-primary">{totalRevenue}</span>{" "}
              in total sales yesterday. Here&apos;s what&apos;s happening today.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-500 border-green-500/20"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                {healthyChannels} of {channels.length} channels healthy
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-500 border-blue-500/20"
              >
                24 new orders today
              </Badge>
            </div>
          </div>
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh All Data"
            )}
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gross Sales"
          value={formatCurrency(totals.grossSales)}
          trend={14.2}
          icon={DollarSign}
          loading={isLoading}
          description="+12.4% vs last week"
        />
        <MetricCard
          title="Total Orders"
          value={formatNumber(totals.orders)}
          trend={8.7}
          icon={ShoppingCart}
          loading={isLoading}
          description="1,847 orders this period"
        />
        <MetricCard
          title="Units Sold"
          value={formatNumber(totals.unitsSold)}
          trend={11.3}
          icon={Package}
          loading={isLoading}
          description="3,294 units shipped"
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          trend={5.4}
          icon={TrendingUp}
          loading={isLoading}
          description="+$7.50 vs last month"
        />
      </div>

      {/* Channels + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Sales Channels
              </h2>
              <p className="text-sm text-muted-foreground">
                Performance across platforms
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                loading={isLoading}
              />
            ))}
          </div>
        </div>

        <AlertsPanel alerts={alerts} loading={isLoading} />
      </div>

      {/* Chart + Inventory */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<LoadingSpinner text="Loading sales chart..." />}>
          <SalesChart />
        </Suspense>

        <Suspense fallback={<LoadingSpinner text="Loading inventory..." />}>
          <InventoryTable items={inventoryItems} loading={isLoading} />
        </Suspense>
      </div>
    </PageContainer>
  );
};
