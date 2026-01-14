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
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/mockData";

const data = [
  {
    date: "Mon",
    amazon: 42000,
    tiktok: 14000,
    walmart: 22000,
    target: 9500,
    faire: 6200,
    shopify: 3200,
  },
  {
    date: "Tue",
    amazon: 38000,
    tiktok: 15500,
    walmart: 21000,
    target: 9800,
    faire: 6800,
    shopify: 3500,
  },
  {
    date: "Wed",
    amazon: 45000,
    tiktok: 18200,
    walmart: 24000,
    target: 10200,
    faire: 7200,
    shopify: 4100,
  },
  {
    date: "Thu",
    amazon: 41000,
    tiktok: 22000,
    walmart: 23500,
    target: 9600,
    faire: 6900,
    shopify: 3800,
  },
  {
    date: "Fri",
    amazon: 48000,
    tiktok: 19500,
    walmart: 26000,
    target: 11000,
    faire: 7500,
    shopify: 4200,
  },
  {
    date: "Sat",
    amazon: 52000,
    tiktok: 24000,
    walmart: 28000,
    target: 12500,
    faire: 8100,
    shopify: 4800,
  },
  {
    date: "Sun",
    amazon: 47000,
    tiktok: 21000,
    walmart: 25500,
    target: 11200,
    faire: 7800,
    shopify: 4200,
  },
];

const channelColors = {
  amazon: "hsl(33 100% 50%)",
  tiktok: "hsl(174 100% 42%)",
  walmart: "hsl(210 100% 45%)",
  target: "hsl(0 75% 55%)",
  faire: "hsl(45 93% 47%)",
  shopify: "hsl(120 45% 45%)",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {entry.dataKey}
                </span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-1 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Total
              </span>
              <span className="text-xs font-semibold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function SalesChart() {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "amazon",
    "tiktok",
    "walmart",
  ]);

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const filteredData = useMemo(() => {
    return data.map((day) => {
      const filteredDay: any = { date: day.date };
      selectedChannels.forEach((channel) => {
        filteredDay[channel] = day[channel as keyof typeof day];
      });
      return filteredDay;
    });
  }, [selectedChannels]);

  const totalSales = useMemo(() => {
    return filteredData.reduce((sum, day) => {
      return (
        sum +
        selectedChannels.reduce(
          (daySum, channel) => daySum + (day[channel] || 0),
          0
        )
      );
    }, 0);
  }, [filteredData, selectedChannels]);

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
            Revenue by channel over time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(channelColors).map(([channel, color]) => {
              const isSelected = selectedChannels.includes(channel);
              return (
                <button
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{channel}</span>
                </button>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Last 7 days
          </Button>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Sales (Selected Channels)
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalSales)}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {selectedChannels.map((channel) => (
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
                    stopColor={
                      channelColors[channel as keyof typeof channelColors]
                    }
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      channelColors[channel as keyof typeof channelColors]
                    }
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
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedChannels.map((channel) => (
              <Area
                key={channel}
                type="monotone"
                dataKey={channel}
                stroke={channelColors[channel as keyof typeof channelColors]}
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
