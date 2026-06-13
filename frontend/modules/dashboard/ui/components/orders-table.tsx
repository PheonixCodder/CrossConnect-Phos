"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { useQueryState } from "nuqs";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-display/data-table";
import { DateTime } from "luxon";
import type { OrderTableRow } from "../../domain/product-view-models";

const STORE_TZ = "America/Los_Angeles";

const columns: ColumnDef<OrderTableRow>[] = [
  {
    accessorKey: "externalOrderId",
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
        {row.original.externalOrderId}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
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
    cell: ({ row }) => formatCurrency(row.original.total),
  },
  {
    accessorKey: "orderedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.original.orderedAt ?? row.original.createdAt;

      if (!raw) return "-";

      const pacific = DateTime.fromISO(raw, { zone: "utc" }).setZone(STORE_TZ);

      return (
        <div className="flex flex-col">
          <span>{pacific.toFormat("MMM dd, yyyy")}</span>
          <span className="text-xs text-muted-foreground">
            {pacific.toFormat("hh:mm a")} PT
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.platform}</span>
    ),
  },
  {
    accessorKey: "fulfillmentStatus",
    header: "Fulfillment",
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
  },
];

interface OrdersTableProps {
  orders: OrderTableRow[];
  loading: boolean;
}

export function OrdersTable({ orders, loading }: OrdersTableProps) {
  const [, setOrderId] = useQueryState("order");

  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Orders</h2>
      <div className="relative overflow-x-auto">
        <DataTable
          columns={columns}
          data={orders}
          isLoading={loading}
          searchKey="externalOrderId"
          defaultSorting={[{ id: "orderedAt", desc: true }]}
          placeholder="Search by Order ID..."
          onRowClick={(row) => setOrderId(row.id)}
          emptyImage="/images/empty.svg"
          emptyDescription="No orders in the selected period or matching your filters."
        />
      </div>
    </div>
  );
}
