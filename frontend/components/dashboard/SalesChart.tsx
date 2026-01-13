'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Mon', amazon: 42000, tiktok: 14000, walmart: 22000, target: 9500, faire: 6200, shopify: 3200 },
  { date: 'Tue', amazon: 38000, tiktok: 15500, walmart: 21000, target: 9800, faire: 6800, shopify: 3500 },
  { date: 'Wed', amazon: 45000, tiktok: 18200, walmart: 24000, target: 10200, faire: 7200, shopify: 4100 },
  { date: 'Thu', amazon: 41000, tiktok: 22000, walmart: 23500, target: 9600, faire: 6900, shopify: 3800 },
  { date: 'Fri', amazon: 48000, tiktok: 19500, walmart: 26000, target: 11000, faire: 7500, shopify: 4200 },
  { date: 'Sat', amazon: 52000, tiktok: 24000, walmart: 28000, target: 12500, faire: 8100, shopify: 4800 },
  { date: 'Sun', amazon: 47000, tiktok: 21000, walmart: 25500, target: 11200, faire: 7800, shopify: 4200 },
];

const channelColors = {
  amazon: 'hsl(33 100% 50%)',
  tiktok: 'hsl(174 100% 42%)',
  walmart: 'hsl(210 100% 45%)',
  target: 'hsl(0 75% 55%)',
  faire: 'hsl(45 93% 47%)',
  shopify: 'hsl(120 45% 45%)',
};

export function SalesChart() {
  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-300 shadow-(--shadow-card) p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sales Trend</h2>
          <p className="text-sm text-muted-foreground">Revenue by channel over time</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {Object.entries(channelColors).map(([channel, color]) => (
            <div key={channel} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">{channel}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {Object.entries(channelColors).map(([channel, color]) => (
                <linearGradient key={channel} id={`gradient-${channel}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(215 20% 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215 20% 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(217 33% 17%)',
                borderRadius: '8px',
                boxShadow: '0 4px 24px -4px hsl(222 47% 0% / 0.5)',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            {Object.entries(channelColors).map(([channel, color]) => (
              <Area
                key={channel}
                type="monotone"
                dataKey={channel}
                stroke={color}
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
