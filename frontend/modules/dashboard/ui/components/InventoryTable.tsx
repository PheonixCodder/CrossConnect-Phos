import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Package, AlertTriangle } from "lucide-react";
import type { Database } from "@/types/supabase.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface InventoryTableProps {
  inventory: Database["public"]["Tables"]["inventory"]["Row"][];
  loading?: boolean;
}

export function InventoryTable({ inventory, loading = false }: InventoryTableProps) {
  const [search, setSearch] = useState("");

  const filteredItems = inventory.filter(
    (item) =>
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="card-base p-5">
        {/* Skeleton */}
        <div className="space-y-4">
           {[...Array(3)].map((_,i) => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded-md"></div>
           ))}
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
               <span className="text-xs font-medium text-orange-500 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10">
                  <AlertTriangle className="h-3 w-3" />
                  Low Stock Items
                </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              <div>Product ID</div>
              <div className="text-right">Warehouse Qty</div>
              <div className="text-center">Status</div>
              <div className="text-right">Updated</div>
            </div>
          </div>

          <div className="divide-y divide-border/30">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium">No items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-5 gap-4 py-3 px-2 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div>
                    <span className="font-mono text-xs font-medium text-primary">
                      {item.sku}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {item.product_id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        (item.warehouse_quantity ?? 0) < 5
                          ? "text-red-500"
                          : (item.warehouse_quantity ?? 0) < 15
                          ? "text-yellow-500"
                          : "text-foreground"
                      )}
                    >
                      {item.warehouse_quantity ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <StatusBadge 
                        status={
                            item.inventory_status === 'out_of_stock' ? 'error' : 
                            item.inventory_status === 'in_stock' ? 'success' : 'warning'
                        } 
                        size="sm" showLabel={false} 
                    />
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
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