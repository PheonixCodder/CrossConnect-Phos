"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatDateTime } from "@/lib/formatters";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-display/data-table";
import type { InventoryTableRow } from "../../domain/product-view-models";

const columns: ColumnDef<InventoryTableRow>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="font-mono text-primary">{row.original.sku}</span>
    ),
  },
  {
    accessorKey: "warehouseQuantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Warehouse Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const qty = row.original.warehouseQuantity;
      return (
        <span
          className={cn(
            "font-medium",
            qty < 5
              ? "text-red-500"
              : qty < 15
                ? "text-yellow-500"
                : "text-foreground",
          )}
        >
          {qty}
        </span>
      );
    },
  },
  {
    accessorKey: "platformQuantity",
    header: "Platform Qty",
    cell: ({ row }) => row.original.platformQuantity,
  },
  {
    accessorKey: "reservedQuantity",
    header: "Reserved",
    cell: ({ row }) => row.original.reservedQuantity,
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
  {
    accessorKey: "lastSyncedAt",
    header: "Last Sync",
    cell: ({ row }) => formatDateTime(row.original.lastSyncedAt),
  },
];

interface InventoryTableProps {
  inventory: InventoryTableRow[];
  loading: boolean;
}

export function InventoryTable({ inventory, loading }: InventoryTableProps) {
  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Inventory</h2>
      <DataTable
        columns={columns}
        data={inventory}
        isLoading={loading}
        searchKey="sku"
        placeholder="Search by SKU..."
        emptyImage="/images/empty.svg"
        emptyDescription="No inventory items available or matching filters."
      />
    </div>
  );
}
