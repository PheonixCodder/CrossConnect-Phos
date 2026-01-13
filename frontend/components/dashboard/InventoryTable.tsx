'use client'
import { cn } from '@/lib/utils';
import { StatusIndicator } from './StatusIndicator';
import { Package, AlertTriangle } from 'lucide-react';
import type { InventoryItem } from '@/lib/mockData';
import { formatNumber } from '@/lib/mockData';

interface InventoryTableProps {
  items: InventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  const lowStockItems = items.filter(i => i.status !== 'healthy');

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-300 shadow-(--shadow-card) p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Inventory Health</h2>
            <p className="text-sm text-muted-foreground">
              {lowStockItems.length > 0 ? (
                <span className="text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lowStockItems.length} items need attention
                </span>
              ) : (
                'All items healthy'
              )}
            </p>
          </div>
        </div>
        <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View all SKUs
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                SKU
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Product
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Available
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Days on Hand
              </th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {items.map((item) => (
              <tr 
                key={item.sku}
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-2">
                  <span className="font-mono text-xs text-primary">{item.sku}</span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm text-foreground">{item.name}</span>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className={cn(
                    'text-sm font-medium',
                    item.status === 'critical' ? 'text-red-500' :
                    item.status === 'warning' ? 'text-yellow-500' : 'text-foreground'
                  )}>
                    {formatNumber(item.available)}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className={cn(
                    'text-sm',
                    item.daysOnHand <= 7 ? 'text-red-500' :
                    item.daysOnHand <= 14 ? 'text-yellow-500' : 'text-muted-foreground'
                  )}>
                    {item.daysOnHand} days
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex justify-center">
                    <StatusIndicator status={item.status} showLabel />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
