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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

interface SalesChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

export function SalesChart({ data, loading = false }: SalesChartProps) {
  const allPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    data.forEach((d) =>
      Object.keys(d).forEach((k) => k !== "date" && platforms.add(k)),
    );
    return Array.from(platforms);
  }, [data]);

  const totalSales = useMemo(
    () =>
      data.reduce(
        (sum, day) =>
          sum +
          allPlatforms.reduce((daySum, p) => daySum + (Number(day[p]) || 0), 0),
        0,
      ),
    [data, allPlatforms],
  );

  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Sales Trend
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue by platform
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-primary/5">
        <p className="text-sm text-muted-foreground">Total Sales</p>
        <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
      </div>

      <div className="h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            {allPlatforms.map((channel, index) => (
              <Area
                key={channel}
                type="monotone"
                dataKey={channel}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
