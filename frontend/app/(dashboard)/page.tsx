import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { ChannelCard } from "@/components/dashboard/ChannelCard"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"
import { InventoryTable } from "@/components/dashboard/InventoryTable"
import { SalesChart } from "@/components/dashboard/SalesChart"
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react"
import {
  channels,
  alerts,
  inventoryItems,
  getTotalMetrics,
  formatCurrency,
  formatNumber,
} from "@/lib/mockData"

export default function Page() {
  const totals = getTotalMetrics()
  const avgOrderValue = totals.grossSales / totals.orders

  return (
    <div className="space-y-8 mx-10 my-5">

      <DashboardHeader />

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gross Sales"
          value={formatCurrency(totals.grossSales)}
          trend={14.2}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Orders"
          value={formatNumber(totals.orders)}
          trend={8.7}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Units Sold"
          value={formatNumber(totals.unitsSold)}
          trend={11.3}
          icon={Package}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          trend={5.4}
          icon={TrendingUp}
        />
      </div>

      {/* Channels + Alerts */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sales Channels</h2>
            <span className="text-sm text-muted-foreground">
              {channels.filter(c => c.status === "healthy").length} of {channels.length} healthy
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map(channel => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        </div>

        <AlertsPanel alerts={alerts} />
      </div>

      {/* Chart + Inventory */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SalesChart />
        <InventoryTable items={inventoryItems} />
      </div>
    </div>
  )
}
