"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package } from "lucide-react";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";

type Return = Database["public"]["Tables"]["returns"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnId: string;
}

export function ReturnDialog({
  open,
  onOpenChange,
  returnId,
}: ReturnDialogProps) {
  const supabase = createClient();

  const { data: ret, isLoading: loadingReturn } = useQuery({
    queryKey: ["return_details", returnId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("*")
        .eq("id", returnId)
        .single();
      if (error) throw error;
      return data as Return;
    },
    enabled: !!returnId,
  });

  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ["linked_order", ret?.order_id],
    queryFn: async () => {
      if (!ret?.order_id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", ret.order_id)
        .single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!ret?.order_id,
  });

  const isLoading = loadingReturn || loadingOrder;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isLoading ? "Loading Return..." : `Return ${ret?.external_return_id}`
      }
      description={
        isLoading
          ? "Fetching details..."
          : `Created on ${formatDateTime(ret?.created_at ?? null)}`
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-8 max-h-[80vh] overflow-y-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:hidden">
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Return Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                Status:{" "}
                <StatusBadge
                  status={ret?.status === "completed" ? "success" : "warning"}
                />
              </div>
              <div>
                Amount:{" "}
                <span className="font-semibold">
                  {formatCurrency(ret?.refund_amount ?? 0)}
                </span>
              </div>
              <div>
                Platform: <span className="capitalize">{ret?.platform}</span>
              </div>
              <div>Updated: {formatDateTime(ret?.updated_at ?? null)}</div>
            </div>
          </section>

          {order && (
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Linked Order
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  Order ID:{" "}
                  <span className="font-mono">{order.external_order_id}</span>
                </div>
                <div>Total: {formatCurrency(order.total ?? 0)}</div>
                <div>
                  Date: {formatDateTime(order.ordered_at ?? order.created_at)}
                </div>
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
              </div>
            </section>
          )}
        </div>
      )}
    </ResponsiveDialog>
  );
}
