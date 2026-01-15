"use client";
import { DashboardHeader } from "@/modules/dashboard/ui/components/DashboardHeader";
import { ChannelCard } from "@/modules/dashboard/ui/components/ChannelCard";
import { MetricCard } from "@/modules/dashboard/ui/components/MetricCard";
import { AlertsPanel } from "@/modules/dashboard/ui/components/AlertsPanel";
import { InventoryTable } from "@/modules/dashboard/ui/components/InventoryTable";
import { SalesChart } from "@/modules/dashboard/ui/components/SalesChart";
import { DollarSign, ShoppingCart, Package, TrendingUp, Sparkles } from "lucide-react";
import {
  channels,
  alerts,
  inventoryItems,
  getTotalMetrics,
  formatCurrency,
  formatNumber,
} from "@/lib/mockData";
import { PageContainer } from "@/components/layout/PageContainer";
import { Suspense, useState } from "react";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const totals = getTotalMetrics();
  const avgOrderValue = totals.orders > 0 ? totals.grossSales / totals.orders : 0;
  const healthyChannels = channels.filter((c) => c.status === "healthy").length;
  const totalRevenue = formatCurrency(totals.grossSales);

  // Simulate loading
  const handleRefreshAll = () => {
    setIsLoading(true);
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
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, Alex!</h1>
            </div>
            <p className="text-muted-foreground mb-3">
              Your business generated <span className="font-semibold text-primary">{totalRevenue}</span> in total sales yesterday. Here&apos;s what&apos;s happening today.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                {healthyChannels} of {channels.length} channels healthy
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
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
                <LoadingSpinner size="sm" className="mr-2" />
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
              <h2 className="text-lg font-semibold text-foreground">Sales Channels</h2>
              <p className="text-sm text-muted-foreground">
                Performance across all connected platforms
              </p>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-green-500">{healthyChannels}</span> of{" "}
              <span className="font-semibold">{channels.length}</span> healthy
            </div>
          </div>

          <Suspense fallback={<LoadingSpinner text="Loading channels..." />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {channels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  loading={isLoading}
                  onClick={() => console.log(`Navigate to ${channel.name}`)}
                />
              ))}
            </div>
          </Suspense>
        </div>

        <Suspense fallback={<LoadingSpinner text="Loading alerts..." />}>
          <AlertsPanel alerts={alerts} loading={isLoading} />
        </Suspense>
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

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-base p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Active Users</p>
          <p className="text-2xl font-bold text-foreground">1,247</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold text-foreground">3.2%</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Avg. Session</p>
          <p className="text-2xl font-bold text-foreground">4m 32s</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Bounce Rate</p>
          <p className="text-2xl font-bold text-foreground">28.5%</p>
        </div>
      </div>
    </PageContainer>
  );
}