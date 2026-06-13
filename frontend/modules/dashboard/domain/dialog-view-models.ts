import type { Database } from "@/types/supabase.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type FulfillmentRow = Database["public"]["Tables"]["fulfillments"]["Row"];
type ReturnRow = Database["public"]["Tables"]["returns"]["Row"];

export type BadgeStatus = "success" | "warning" | "error";

export interface ProductDetailViewModel {
  title: string;
  sku: string;
  price: number;
  status: BadgeStatus;
  platform: string;
  updatedAt: string | null;
  description: string;
}

export interface ProductInventoryDetailRow {
  id: string;
  sku: string;
  warehouseQuantity: number;
  platformQuantity: number;
  status: BadgeStatus;
  updatedAt: string | null;
}

export interface ProductAlertDetailRow {
  id: string;
  alertType: string;
  message: string;
  status: BadgeStatus;
  createdAt: string;
}

export function toProductDetail(
  product: ProductRow | null | undefined,
): ProductDetailViewModel | null {
  if (!product) return null;

  return {
    title: product.title ?? "Product Details",
    sku: product.sku,
    price: product.price ?? 0,
    status: product.status === "active" ? "success" : "warning",
    platform: product.platform,
    updatedAt: product.updated_at,
    description: product.description ?? "No description available.",
  };
}

export function toProductInventoryDetailRows(
  inventory: InventoryRow[],
): ProductInventoryDetailRow[] {
  return inventory.map((item) => ({
    id: item.id,
    sku: item.sku,
    warehouseQuantity: item.warehouse_quantity ?? 0,
    platformQuantity: item.platform_quantity ?? 0,
    status:
      item.inventory_status === "out_of_stock"
        ? "error"
        : item.inventory_status === "backorder" ||
            item.inventory_status === "discontinued"
          ? "warning"
          : "success",
    updatedAt: item.updated_at,
  }));
}

export function toProductAlertDetailRows(
  alerts: AlertRow[],
): ProductAlertDetailRow[] {
  return alerts.map((alert) => ({
    id: alert.id,
    alertType: alert.alert_type,
    message: alert.message,
    status:
      alert.severity === "critical"
        ? "error"
        : alert.severity === "low" || alert.severity === "medium"
          ? "warning"
          : "success",
    createdAt: alert.created_at,
  }));
}

export interface OrderDetailViewModel {
  externalOrderId: string;
  placedAt: string | null;
  status: BadgeStatus;
  fulfillmentStatus: BadgeStatus;
  paymentStatus: BadgeStatus;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  platform: string;
}

export interface OrderItemDetailRow {
  id: string;
  sku: string | null;
  quantity: number;
  price: number;
  total: number;
  fulfilledQuantity: number;
  refundedQuantity: number;
}

export interface FulfillmentDetailRow {
  id: string;
  status: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  updatedAt: string | null;
}

export interface OrderReturnDetailRow {
  id: string;
  status: string;
  refundAmount: number;
  updatedAt: string | null;
}

export function toOrderDetail(
  order: OrderRow | null | undefined,
): OrderDetailViewModel | null {
  if (!order) return null;

  return {
    externalOrderId: order.external_order_id,
    placedAt: order.ordered_at ?? order.created_at,
    status:
      order.status === "refunded" || order.status === "cancelled"
        ? "error"
        : order.status === "pending"
          ? "warning"
          : "success",
    fulfillmentStatus:
      order.fulfillment_status === "fulfilled" ? "success" : "error",
    paymentStatus: order.payment_status === "paid" ? "success" : "error",
    total: order.total ?? 0,
    subtotal: order.subtotal ?? 0,
    shipping: order.shipping ?? 0,
    tax: order.tax ?? 0,
    platform: order.platform,
  };
}

export function toOrderItemDetailRows(
  items: OrderItemRow[],
): OrderItemDetailRow[] {
  return items.map((item) => ({
    id: item.id,
    sku: item.sku,
    quantity: item.quantity ?? 0,
    price: item.price ?? 0,
    total: item.total ?? 0,
    fulfilledQuantity: item.fulfilled_quantity ?? 0,
    refundedQuantity: item.refunded_quantity ?? 0,
  }));
}

export function toFulfillmentDetailRows(
  fulfillments: FulfillmentRow[],
): FulfillmentDetailRow[] {
  return fulfillments.map((fulfillment) => ({
    id: fulfillment.id,
    status: fulfillment.status,
    carrier: fulfillment.carrier,
    trackingNumber: fulfillment.tracking_number,
    updatedAt: fulfillment.updated_at,
  }));
}

export function toOrderReturnDetailRows(
  returns: ReturnRow[],
): OrderReturnDetailRow[] {
  return returns.map((returnRow) => ({
    id: returnRow.id,
    status: returnRow.status,
    refundAmount: returnRow.refund_amount ?? 0,
    updatedAt: returnRow.updated_at,
  }));
}

export interface ReturnDetailViewModel {
  externalReturnId: string;
  createdAt: string;
  status: BadgeStatus;
  refundAmount: number;
  platform: string;
  updatedAt: string | null;
}

export interface LinkedOrderDetailViewModel {
  externalOrderId: string;
  total: number;
  date: string;
  status: BadgeStatus;
}

export function toReturnDetail(
  returnRow: ReturnRow | null | undefined,
): ReturnDetailViewModel | null {
  if (!returnRow) return null;

  return {
    externalReturnId: returnRow.external_return_id,
    createdAt: returnRow.created_at,
    status: returnRow.status === "completed" ? "success" : "warning",
    refundAmount: returnRow.refund_amount ?? 0,
    platform: returnRow.platform,
    updatedAt: returnRow.updated_at,
  };
}

export function toLinkedOrderDetail(
  order: OrderRow | null | undefined,
): LinkedOrderDetailViewModel | null {
  if (!order) return null;

  return {
    externalOrderId: order.external_order_id,
    total: order.total ?? 0,
    date: order.ordered_at ?? order.created_at,
    status:
      order.status === "refunded" || order.status === "cancelled"
        ? "error"
        : order.status === "pending"
          ? "warning"
          : "success",
  };
}
