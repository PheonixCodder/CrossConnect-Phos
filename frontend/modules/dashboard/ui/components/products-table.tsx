"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { Database } from "@/types/supabase.types";
import { parseAsString, useQueryState } from "nuqs";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-display/data-table";

type Product = Database["public"]["Tables"]["products"]["Row"];

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title ?? "Untitled"}</span>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="font-mono text-primary">{row.original.sku}</span>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatCurrency(row.original.price ?? 0),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.status === "active" ? "success" : "warning"}
        size="sm"
      />
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => formatDateTime(row.original.updated_at),
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.platform}</span>
    ),
  },
  {
    accessorKey: "external_product_id",
    header: "External ID",
  },
];

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
}

export function ProductsTable({ products, loading }: ProductsTableProps) {
  const [, setProductId] = useQueryState("product");

  return (
    <div className="card-base p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Products</h2>
      <div className="relative overflow-x-auto">
        <DataTable
          columns={columns}
          data={products}
          isLoading={loading}
          searchKey="title"
          placeholder="Search by Title or SKU..."
          onRowClick={(row) => setProductId(row.id)}
          emptyImage="/images/empty.svg"
          emptyDescription="No products available or matching your filters."
        />
      </div>
    </div>
  );
}
