"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useQueryState } from "nuqs";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-display/data-table";
import type { ReturnTableRow } from "../../domain/product-view-models";

const columns: ColumnDef<ReturnTableRow>[] = [
  {
    accessorKey: "externalReturnId",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Return ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-primary">
        {row.original.externalReturnId}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
  },
  {
    accessorKey: "refundAmount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatCurrency(row.original.refundAmount),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.platform}</span>
    ),
  },
];

interface ReturnsTableProps {
  returns: ReturnTableRow[];
  loading: boolean;
}

export function ReturnsTable({ returns, loading }: ReturnsTableProps) {
  const [, setReturnId] = useQueryState("return");

  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Returns</h2>
      <div className="relative overflow-x-auto">
        <DataTable
          columns={columns}
          data={returns}
          isLoading={loading}
          searchKey="externalReturnId"
          placeholder="Search by Return ID..."
          onRowClick={(row) => setReturnId(row.id)}
          emptyImage="/images/empty.svg"
          emptyDescription="No returns in the selected period or matching filters."
        />
      </div>
    </div>
  );
}
