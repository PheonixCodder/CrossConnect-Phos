"use client";

import { DateTime } from "luxon";
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
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { SalesTrendRow } from "../../domain/summary-view-models";

interface SalesChartProps {
  data: SalesTrendRow[];
  loading?: boolean;
}

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#f97316",
];

export function SalesChart({ data, loading }: SalesChartProps) {
  const platforms = useMemo(() => {
    const set = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "date") set.add(key);
      });
    });
    return Array.from(set);
  }, [data]);

  const normalizedData = useMemo(() => {
    return data.map((row) => {
      const filled: SalesTrendRow = { date: row.date };
      platforms.forEach((platform) => {
        filled[platform] = Number(row[platform]) || 0;
      });
      return filled;
    });
  }, [data, platforms]);

  const totalGrossSales = useMemo(() => {
    return normalizedData.reduce((sum, day) => {
      return (
        sum +
        platforms.reduce(
          (platformSum, platform) => platformSum + (day[platform] as number),
          0,
        )
      );
    }, 0);
  }, [normalizedData, platforms]);

  if (loading) {
    return <Skeleton className="h-[380px] w-full rounded-xl" />;
  }

  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Gross Sales Trend
          </h2>
          <p className="text-sm text-muted-foreground">
            Gross revenue by platform
          </p>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-primary/5">
        <p className="text-sm text-muted-foreground">Total Gross Sales</p>
        <p className="text-2xl font-bold">{formatCurrency(totalGrossSales)}</p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={normalizedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              interval="preserveStartEnd"
              tickFormatter={(value) =>
                DateTime.fromISO(value).toFormat("MMM dd")
              }
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) =>
                DateTime.fromISO(label).toFormat("MMM dd, yyyy")
              }
            />
            {platforms.map((platform, index) => (
              <Area
                key={platform}
                type="monotone"
                dataKey={platform}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.35}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
