"use client";

import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Truck } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { DataTable } from "@/components/data-display/data-table";
import { useOrderDialogData } from "../../hooks/use-dashboard-detail-dialogs";
import {
  FulfillmentDetailRow,
  OrderItemDetailRow,
  OrderReturnDetailRow,
} from "../../domain/dialog-view-models";

const itemColumns: ColumnDef<OrderItemDetailRow>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => formatCurrency(row.original.price),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.original.total),
  },
  {
    accessorKey: "fulfilledQuantity",
    header: "Fulfilled",
  },
  {
    accessorKey: "refundedQuantity",
    header: "Refunded",
  },
];

const fulfillmentColumns: ColumnDef<FulfillmentDetailRow>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "carrier",
    header: "Carrier",
  },
  {
    accessorKey: "trackingNumber",
    header: "Tracking",
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updatedAt),
  },
];

const returnColumns: ColumnDef<OrderReturnDetailRow>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "refundAmount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.refundAmount),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updatedAt),
  },
];

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function OrderDialog({ open, onOpenChange, orderId }: OrderDialogProps) {
  const { order, items, fulfillments, returns, isLoading } =
    useOrderDialogData(orderId);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isLoading ? "Loading Order..." : `Order ${order?.externalOrderId}`}
      description={
        isLoading
          ? "Fetching details..."
          : `Placed on ${formatDate(order?.placedAt ?? null)}`
      }
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
              <AlertTriangle className="h-5 w-5 text-primary" />
              Order Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                Status: <StatusBadge status={order?.status ?? "warning"} />
              </div>
              <div>
                Fulfillment:{" "}
                <StatusBadge status={order?.fulfillmentStatus ?? "warning"} />
              </div>
              <div>
                Payment:{" "}
                <StatusBadge status={order?.paymentStatus ?? "warning"} />
              </div>
              <div>
                Total:{" "}
                <span className="font-semibold">
                  {formatCurrency(order?.total ?? 0)}
                </span>
              </div>
              <div>Subtotal: {formatCurrency(order?.subtotal ?? 0)}</div>
              <div>Shipping: {formatCurrency(order?.shipping ?? 0)}</div>
              <div>Tax: {formatCurrency(order?.tax ?? 0)}</div>
              <div>
                Platform: <span className="capitalize">{order?.platform}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Items
            </h3>
            <DataTable
              columns={itemColumns}
              data={items}
              searchKey="sku"
              placeholder="Search items..."
            />
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Fulfillments / Shipments
            </h3>
            <DataTable
              columns={fulfillmentColumns}
              data={fulfillments}
              searchKey="trackingNumber"
              placeholder="Search fulfillments..."
            />
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Returns
            </h3>
            <DataTable
              columns={returnColumns}
              data={returns}
              placeholder="Search returns..."
            />
          </section>
        </div>
      )}
    </ResponsiveDialog>
  );
}
