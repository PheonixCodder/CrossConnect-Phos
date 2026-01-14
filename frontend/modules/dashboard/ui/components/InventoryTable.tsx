"use client";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Package, AlertTriangle, Search } from "lucide-react";
import type { InventoryItem } from "@/lib/mockData";
import { formatNumber } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface InventoryTableProps {
  items: InventoryItem[];
  loading?: boolean;
}

export function InventoryTable({ items, loading = false }: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"available" | "daysOnHand" | "status">("available");

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = filteredItems.filter((i) => i.status !== "healthy");
  const criticalItems = filteredItems.filter((i) => i.status === "critical");

  if (loading) {
    return (
      <div className="card-base p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
                <div className="h-3 w-32 rounded-md bg-muted animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="overflow-hidden">
            <div className="w-full">
              <div className="border-b border-border/50">
                <div className="grid grid-cols-5 gap-4 py-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border/30">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 py-3">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-4 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Inventory Health</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {criticalItems.length > 0 && (
                <span className="text-xs font-medium text-red-500 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalItems.length} critical items
                </span>
              )}
              {lowStockItems.length > 0 && criticalItems.length === 0 && (
                <span className="text-xs font-medium text-yellow-500 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10">
                  <AlertTriangle className="h-3 w-3" />
                  {lowStockItems.length} items need attention
                </span>
              )}
              {lowStockItems.length === 0 && (
                <span className="text-xs font-medium text-green-500 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10">
                  All items healthy
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search SKU or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-48"
            />
          </div>
          <Button variant="outline" size="sm">
            View all SKUs
          </Button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="w-full">
          <div className="border-b border-border/50">
            <div className="grid grid-cols-5 gap-4 py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div>SKU</div>
              <div>Product</div>
              <div className="text-right">Available</div>
              <div className="text-right">Days on Hand</div>
              <div className="text-center">Status</div>
            </div>
          </div>

          <div className="divide-y divide-border/30">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium">No items found</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Try adjusting your search
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.sku}
                  className="grid grid-cols-5 gap-4 py-3 px-2 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div>
                    <span className="font-mono text-xs font-medium text-primary">
                      {item.sku}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.status === "critical"
                          ? "text-red-500"
                          : item.status === "warning"
                          ? "text-yellow-500"
                          : "text-foreground"
                      )}
                    >
                      {formatNumber(item.available)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.daysOnHand <= 7
                          ? "text-red-500"
                          : item.daysOnHand <= 14
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.daysOnHand} days
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <StatusBadge status={item.status} size="sm" showLabel />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}