"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatDateTime } from "@/lib/formatters";
import type { Database } from "@/types/supabase.types";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-display/data-table";

type Inventory = Database["public"]["Tables"]["inventory"]["Row"];

const columns: ColumnDef<Inventory>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <span className="font-mono text-primary">{row.original.sku}</span>,
  },
  {
    accessorKey: "warehouse_quantity",
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
      const qty = row.original.warehouse_quantity ?? 0;
      return (
        <span className={cn(
          "font-medium",
          qty < 5 ? "text-red-500" : qty < 15 ? "text-yellow-500" : "text-foreground"
        )}>
          {qty}
        </span>
      );
    },
  },
  {
    accessorKey: "platform_quantity",
    header: "Platform Qty",
    cell: ({ row }) => row.original.platform_quantity ?? 0,
  },
  {
    accessorKey: "reserved_quantity",
    header: "Reserved",
    cell: ({ row }) => row.original.reserved_quantity ?? 0,
  },
  {
    accessorKey: "inventory_status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.inventory_status === "in_stock" ? "success" : row.original.inventory_status === "out_of_stock" ? "error" : "warning"} size="sm" />,
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updated_at),
  },
  {
    accessorKey: "last_synced_at",
    header: "Last Sync",
    cell: ({ row }) => formatDateTime(row.original.last_synced_at),
  },
];

interface InventoryTableProps {
  inventory: Inventory[];
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