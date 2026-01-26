"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Bell } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { DataTable } from "@/components/data-display/data-table";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Inventory = Database["public"]["Tables"]["inventory"]["Row"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"];

const inventoryColumns: ColumnDef<Inventory>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "warehouse_quantity",
    header: "Warehouse Qty",
  },
  {
    accessorKey: "platform_quantity",
    header: "Platform Qty",
  },
  {
    accessorKey: "inventory_status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={
          row.original.inventory_status === "backorder" ||
          row.original.inventory_status === "discontinued"
            ? "warning"
            : row.original.inventory_status === "out_of_stock"
              ? "error"
              : "success"
        }
        size="sm"
      />
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updated_at),
  },
];

const alertColumns: ColumnDef<Alert>[] = [
  {
    accessorKey: "alert_type",
    header: "Type",
  },
  {
    accessorKey: "message",
    header: "Message",
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => (
      <StatusBadge
        status={
          row.original.severity === "low" || row.original.severity === "medium"
            ? "warning"
            : row.original.severity === "critical"
              ? "error"
              : "success"
        }
        size="sm"
      />
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
];

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function ProductDialog({
  open,
  onOpenChange,
  productId,
}: ProductDialogProps) {
  const supabase = createClient();

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product_details", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory_details", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      return data as Inventory[];
    },
    enabled: !!productId,
  });

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ["alerts_details", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("product_id", productId)
        .eq("resolved", false);
      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!productId,
  });

  const isLoading = loadingProduct || loadingInventory || loadingAlerts;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isLoading ? "Loading Product..." : (product?.title ?? "Product Details")
      }
      description={isLoading ? "Fetching details..." : `SKU: ${product?.sku}`}
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-8 max-h-[80vh] overflow-y-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:hidden">
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Product Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                Price:{" "}
                <span className="font-semibold">
                  {formatCurrency(product?.price ?? 0)}
                </span>
              </div>
              <div>
                Status:{" "}
                <StatusBadge
                  status={product?.status === "active" ? "success" : "warning"}
                />
              </div>
              <div>
                Platform:{" "}
                <span className="capitalize">{product?.platform}</span>
              </div>
              <div>Updated: {formatDateTime(product?.updated_at ?? null)}</div>
              <div className="md:col-span-2">
                Description:{" "}
                {product?.description ?? "No description available."}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Inventory
            </h3>
            <DataTable
              columns={inventoryColumns}
              data={inventory}
              placeholder="Search inventory..."
            />
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              Active Alerts
            </h3>
            <DataTable
              columns={alertColumns}
              data={alerts}
              placeholder="Search alerts..."
            />
          </section>
        </div>
      )}
    </ResponsiveDialog>
  );
}
