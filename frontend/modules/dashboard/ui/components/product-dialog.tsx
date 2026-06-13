"use client";

import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Bell } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { DataTable } from "@/components/data-display/data-table";
import { useProductDialogData } from "../../hooks/use-dashboard-detail-dialogs";
import {
  ProductAlertDetailRow,
  ProductInventoryDetailRow,
} from "../../domain/dialog-view-models";

const inventoryColumns: ColumnDef<ProductInventoryDetailRow>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "warehouseQuantity",
    header: "Warehouse Qty",
  },
  {
    accessorKey: "platformQuantity",
    header: "Platform Qty",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updatedAt),
  },
];

const alertColumns: ColumnDef<ProductAlertDetailRow>[] = [
  {
    accessorKey: "alertType",
    header: "Type",
  },
  {
    accessorKey: "message",
    header: "Message",
  },
  {
    accessorKey: "status",
    header: "Severity",
    cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
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
  const { product, inventory, alerts, isLoading } =
    useProductDialogData(productId);

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
                Status: <StatusBadge status={product?.status ?? "warning"} />
              </div>
              <div>
                Platform:{" "}
                <span className="capitalize">{product?.platform}</span>
              </div>
              <div>Updated: {formatDateTime(product?.updatedAt ?? null)}</div>
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
