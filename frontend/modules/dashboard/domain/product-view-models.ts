import type { Database } from "@/types/supabase.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ReturnRow = Database["public"]["Tables"]["returns"]["Row"];

export interface ProductTableRow {
  id: string;
  title: string;
  sku: string;
  price: number;
  status: "success" | "warning";
  updatedAt: string | null;
  platform: string;
  externalProductId: string;
}

export function toProductTableRows(products: ProductRow[]): ProductTableRow[] {
  return products.map((product) => ({
    id: product.id,
    title: product.title ?? "Untitled",
    sku: product.sku,
    price: product.price ?? 0,
    status: product.status === "active" ? "success" : "warning",
    updatedAt: product.updated_at,
    platform: product.platform,
    externalProductId: product.external_product_id,
  }));
}

export interface InventoryTableRow {
  id: string;
  sku: string;
  warehouseQuantity: number;
  platformQuantity: number;
  reservedQuantity: number;
  status: "success" | "warning" | "error";
  updatedAt: string | null;
  lastSyncedAt: string | null;
}

export function toInventoryTableRows(
  inventory: InventoryRow[],
): InventoryTableRow[] {
  return inventory.map((item) => ({
    id: item.id,
    sku: item.sku,
    warehouseQuantity: item.warehouse_quantity ?? 0,
    platformQuantity: item.platform_quantity ?? 0,
    reservedQuantity: item.reserved_quantity ?? 0,
    status:
      item.inventory_status === "in_stock"
        ? "success"
        : item.inventory_status === "out_of_stock"
          ? "error"
          : "warning",
    updatedAt: item.updated_at,
    lastSyncedAt: item.last_synced_at,
  }));
}

export interface OrderTableRow {
  id: string;
  externalOrderId: string;
  status: "success" | "warning";
  rawStatus: string;
  total: number;
  orderedAt: string | null;
  createdAt: string;
  platform: string;
  fulfillmentStatus: string | null;
  paymentStatus: string | null;
}

export function toOrderTableRows(orders: OrderRow[]): OrderTableRow[] {
  return orders.map((order) => ({
    id: order.id,
    externalOrderId: order.external_order_id,
    status:
      order.status === "refunded" ||
      order.status === "cancelled" ||
      order.status === "pending"
        ? "warning"
        : "success",
    rawStatus: order.status,
    total: order.total ?? 0,
    orderedAt: order.ordered_at,
    createdAt: order.created_at,
    platform: order.platform,
    fulfillmentStatus: order.fulfillment_status,
    paymentStatus: order.payment_status,
  }));
}

export interface ReturnTableRow {
  id: string;
  externalReturnId: string;
  status: "success" | "warning";
  rawStatus: string;
  refundAmount: number;
  createdAt: string;
  platform: string;
}

export function toReturnTableRows(returns: ReturnRow[]): ReturnTableRow[] {
  return returns.map((returnRow) => ({
    id: returnRow.id,
    externalReturnId: returnRow.external_return_id,
    status: returnRow.status === "completed" ? "success" : "warning",
    rawStatus: returnRow.status,
    refundAmount: returnRow.refund_amount ?? 0,
    createdAt: returnRow.created_at,
    platform: returnRow.platform,
  }));
}
