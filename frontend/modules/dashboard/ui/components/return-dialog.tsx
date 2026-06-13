"use client";

import { StatusBadge } from "@/components/data-display/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package } from "lucide-react";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { useReturnDialogData } from "../../hooks/use-dashboard-detail-dialogs";

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
  const { returnDetail, linkedOrder, isLoading } =
    useReturnDialogData(returnId);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isLoading
          ? "Loading Return..."
          : `Return ${returnDetail?.externalReturnId}`
      }
      description={
        isLoading
          ? "Fetching details..."
          : `Created on ${formatDateTime(returnDetail?.createdAt ?? null)}`
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
                <StatusBadge status={returnDetail?.status ?? "warning"} />
              </div>
              <div>
                Amount:{" "}
                <span className="font-semibold">
                  {formatCurrency(returnDetail?.refundAmount ?? 0)}
                </span>
              </div>
              <div>
                Platform:{" "}
                <span className="capitalize">{returnDetail?.platform}</span>
              </div>
              <div>
                Updated: {formatDateTime(returnDetail?.updatedAt ?? null)}
              </div>
            </div>
          </section>

          {linkedOrder && (
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Linked Order
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  Order ID:{" "}
                  <span className="font-mono">
                    {linkedOrder.externalOrderId}
                  </span>
                </div>
                <div>Total: {formatCurrency(linkedOrder.total)}</div>
                <div>Date: {formatDateTime(linkedOrder.date)}</div>
                <div>
                  Status: <StatusBadge status={linkedOrder.status} />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </ResponsiveDialog>
  );
}
