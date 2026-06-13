"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";
import {
  toFulfillmentDetailRows,
  toLinkedOrderDetail,
  toOrderDetail,
  toOrderItemDetailRows,
  toOrderReturnDetailRows,
  toProductAlertDetailRows,
  toProductDetail,
  toProductInventoryDetailRows,
  toReturnDetail,
} from "../domain/dialog-view-models";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type FulfillmentRow = Database["public"]["Tables"]["fulfillments"]["Row"];
type ReturnRow = Database["public"]["Tables"]["returns"]["Row"];

export function useProductDialogData(productId: string) {
  const supabase = useMemo(() => createClient(), []);

  const productQuery = useQuery({
    queryKey: ["product_details", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data as ProductRow;
    },
    enabled: !!productId,
  });

  const inventoryQuery = useQuery({
    queryKey: ["inventory_details", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      return data as InventoryRow[];
    },
    enabled: !!productId,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts_details", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("product_id", productId)
        .eq("resolved", false);
      if (error) throw error;
      return data as AlertRow[];
    },
    enabled: !!productId,
  });

  return {
    product: toProductDetail(productQuery.data),
    inventory: toProductInventoryDetailRows(inventoryQuery.data ?? []),
    alerts: toProductAlertDetailRows(alertsQuery.data ?? []),
    isLoading:
      productQuery.isLoading ||
      inventoryQuery.isLoading ||
      alertsQuery.isLoading,
  };
}

export function useOrderDialogData(orderId: string) {
  const supabase = useMemo(() => createClient(), []);

  const orderQuery = useQuery({
    queryKey: ["order_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as OrderRow;
    },
    enabled: !!orderId,
  });

  const itemsQuery = useQuery({
    queryKey: ["order_items_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as OrderItemRow[];
    },
    enabled: !!orderId,
  });

  const fulfillmentsQuery = useQuery({
    queryKey: ["fulfillments_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillments")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as FulfillmentRow[];
    },
    enabled: !!orderId,
  });

  const returnsQuery = useQuery({
    queryKey: ["returns_details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as ReturnRow[];
    },
    enabled: !!orderId,
  });

  return {
    order: toOrderDetail(orderQuery.data),
    items: toOrderItemDetailRows(itemsQuery.data ?? []),
    fulfillments: toFulfillmentDetailRows(fulfillmentsQuery.data ?? []),
    returns: toOrderReturnDetailRows(returnsQuery.data ?? []),
    isLoading:
      orderQuery.isLoading ||
      itemsQuery.isLoading ||
      fulfillmentsQuery.isLoading ||
      returnsQuery.isLoading,
  };
}

export function useReturnDialogData(returnId: string) {
  const supabase = useMemo(() => createClient(), []);

  const returnQuery = useQuery({
    queryKey: ["return_details", returnId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("*")
        .eq("id", returnId)
        .single();
      if (error) throw error;
      return data as ReturnRow;
    },
    enabled: !!returnId,
  });

  const orderQuery = useQuery({
    queryKey: ["linked_order", returnQuery.data?.order_id],
    queryFn: async () => {
      if (!returnQuery.data?.order_id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", returnQuery.data.order_id)
        .single();
      if (error) throw error;
      return data as OrderRow;
    },
    enabled: !!returnQuery.data?.order_id,
  });

  return {
    returnDetail: toReturnDetail(returnQuery.data),
    linkedOrder: toLinkedOrderDetail(orderQuery.data),
    isLoading: returnQuery.isLoading || orderQuery.isLoading,
  };
}
