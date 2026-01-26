"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Truck } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { DataTable } from "@/components/data-display/data-table";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Fulfillment = Database["public"]["Tables"]["fulfillments"]["Row"];
type Return = Database["public"]["Tables"]["returns"]["Row"];

const itemColumns: ColumnDef<OrderItem>[] = [
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
    accessorKey: "fulfilled_quantity",
    header: "Fulfilled",
  },
  {
    accessorKey: "refunded_quantity",
    header: "Refunded",
  },
];

const fulfillmentColumns: ColumnDef<Fulfillment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "carrier",
    header: "Carrier",
  },
  {
    accessorKey: "tracking_number",
    header: "Tracking",
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updated_at),
  },
];

const returnColumns: ColumnDef<Return>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "refund_amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.refund_amount ?? 0),
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updated_at),
  },
];

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function OrderDialog({ open, onOpenChange, orderId }: OrderDialogProps) {
  const supabase = createClient();

  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ["order_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!orderId,
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["order_items_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });

  const { data: fulfillments = [], isLoading: loadingFulfillments } = useQuery({
    queryKey: ["fulfillments_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillments")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as Fulfillment[];
    },
    enabled: !!orderId,
  });

  const { data: returns = [], isLoading: loadingReturns } = useQuery({
    queryKey: ["returns_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as Return[];
    },
    enabled: !!orderId,
  });

  const isLoading =
    loadingOrder || loadingItems || loadingFulfillments || loadingReturns;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isLoading ? "Loading Order..." : `Order ${order?.external_order_id}`
      }
      description={
        isLoading
          ? "Fetching details..."
          : `Placed on ${formatDate(order?.ordered_at ?? order?.created_at ?? null)}`
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
                Status:{" "}
                <StatusBadge
                  status={
                    order?.status === "refunded" ||
                    order?.status === "cancelled"
                      ? "error"
                      : order?.status === "pending"
                        ? "warning"
                        : "success"
                  }
                />
              </div>
              <div>
                Fulfillment:{" "}
                <StatusBadge
                  status={
                    order?.fulfillment_status === "fulfilled"
                      ? "success"
                      : "error"
                  }
                />
              </div>
              <div>
                Payment:{" "}
                <StatusBadge
                  status={
                    order?.payment_status === "paid"
                      ? "success"
                      : "error"
                  }
                />
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
              searchKey="tracking_number"
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
