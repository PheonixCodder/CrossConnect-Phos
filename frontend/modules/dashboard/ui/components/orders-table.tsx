"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { Database } from "@/types/supabase.types";
import { useQueryState } from "nuqs";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-display/data-table";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "external_order_id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Order ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-primary">
        {row.original.external_order_id}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={
          row.original.status === "refunded" ||
          row.original.status === "cancelled"
            ? "warning"
            : row.original.status === "pending"
              ? "warning"
              : "success"
        }
        size="sm"
      />
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatCurrency(row.original.total ?? 0),
  },
  {
    accessorKey: "ordered_at",
    header: "Date",
    cell: ({ row }) =>
      formatDateTime(row.original.ordered_at ?? row.original.created_at),
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.platform}</span>
    ),
  },
  {
    accessorKey: "fulfillment_status",
    header: "Fulfillment",
  },
  {
    accessorKey: "payment_status",
    header: "Payment",
  },
];

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
}

export function OrdersTable({ orders, loading }: OrdersTableProps) {
  const [, setOrderId] = useQueryState<string | null>("order", {
    defaultValue: null,
  });

  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Orders</h2>
      <DataTable
        columns={columns}
        data={orders}
        isLoading={loading}
        searchKey="external_order_id"
        placeholder="Search by Order ID..."
        onRowClick={(row) => setOrderId(row.id)}
        emptyImage="/images/empty.svg"
        emptyDescription="No orders in the selected period or matching your filters."
      />
    </div>
  );
}
