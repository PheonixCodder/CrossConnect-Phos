"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Type matching the aggregation from useDashboardData
interface ChartDataPoint {
  date: string;
  [key: string]: any; // sales per platform
}

interface SalesChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

const COLORS: Record<string, string> = {
  amazon: "hsl(33 100% 50%)",
  tiktok: "hsl(174 100% 42%)",
  walmart: "hsl(210 100% 45%)",
  target: "hsl(0 75% 55%)",
  faire: "hsl(45 93% 47%)",
  shopify: "hsl(120 45% 45%)",
};

export function SalesChart({ data, loading = false }: SalesChartProps) {
  const allPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    data.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== "date") platforms.add(k);
      });
    });
    return Array.from(platforms);
  }, [data]);

  const totalSales = useMemo(() => {
    return data.reduce((sum, day) => {
      return (
        sum + allPlatforms.reduce((daySum, p) => daySum + (day[p] || 0), 0)
      );
    }, 0);
  }, [data, allPlatforms]);

  if (loading) {
    return (
      <div className="card-base p-5 h-[400px] flex items-center justify-center">
        {/* Reuse loading spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="card-base p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Sales Trend
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Revenue by platform over selected period
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Sales (Selected Period)
            </p>
            <p className="text-2xl font-bold text-foreground">
              {totalSales.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {allPlatforms.map((channel) => (
                <linearGradient
                  key={channel}
                  id={`gradient-${channel}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={COLORS[channel] || "#8884d8"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS[channel] || "#8884d8"}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="white"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="white"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            {/* Re-use the tooltip logic from mock if compatible or simplified version */}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />

            {allPlatforms.map((channel) => (
              <Area
                key={channel}
                type="monotone"
                dataKey={channel}
                stroke={COLORS[channel] || "#8884d8"}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${channel})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
