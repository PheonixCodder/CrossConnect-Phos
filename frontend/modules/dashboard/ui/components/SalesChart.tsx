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
import { Enums } from "@/types/supabase.types";

type Platform = Enums<"platform_types">;

interface ChartRow {
  date: string;
  [key: string]: number | string;
}

interface SalesChartProps {
  data: ChartRow[];
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
  const platforms = useMemo<Platform[]>(() => {
    const set = new Set<Platform>();
    data.forEach((row) =>
        Object.keys(row).forEach((k) => {
          if (k !== "date") set.add(k as Platform);
        }),
    );
    return Array.from(set);
  }, [data]);

  const normalizedData = useMemo(() => {
    return data.map((row) => {
      const filled: ChartRow = { date: row.date };
      platforms.forEach((p) => {
        filled[p] = Number(row[p]) || 0;
      });
      return filled;
    });
  }, [data, platforms]);

  const totalSales = useMemo(() => {
    return normalizedData.reduce((sum, day) => {
      return (
          sum +
          platforms.reduce(
              (pSum, p) => pSum + (day[p] as number),
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
              Sales Trend
            </h2>
            <p className="text-sm text-muted-foreground">
              Net revenue by platform
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-primary/5">
          <p className="text-sm text-muted-foreground">Total Net Sales</p>
          <p className="text-2xl font-bold">
            {formatCurrency(totalSales)}
          </p>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={normalizedData}>
              <CartesianGrid  strokeDasharray="3 3" vertical={false}
                              className={'bg-black'}
              />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                  wrapperClassName={'border-10'}
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(l) => `Date: ${l}`}
              />
              {platforms.map((p, i) => (
                  <Area
                      key={p}
                      type="monotone"
                      dataKey={p}
                      stackId="1"
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.35}
                  />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
  );
}
