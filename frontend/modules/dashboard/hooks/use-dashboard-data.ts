"use client";

import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/store/useStore";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.types";

// Types for Aggregations
export type TimeRange = "7d" | "30d" | "90d" | "1y";

export interface AggregatedMetrics {
  grossSales: number;
  orders: number;
  unitsSold: number;
  avgOrderValue: number;
}

export interface StoreMetrics {
  storeId: string;
  sales: number;
  orders: number;
  units: number;
}

export function useDashboardData(timeRange: TimeRange) {
  const supabase = createClient();
  const { activeOrg, activeStore } = useDashboardStore();

  // 1. Determine Date Range Filter
  const startDate = new Date();
  const subDaysMap: Record<TimeRange, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };
  startDate.setDate(startDate.getDate() - (subDaysMap[timeRange] || 7));
  const startDateIso = startDate.toISOString();

  // 2. Determine Scoping (Org vs Store)
  const isOrgView = !activeStore;
  // If Org view, we might have many stores. We need their IDs to filter orders efficiently.
  // If Store view, we just use that ID.

  // Fetch Stores (Needed for Channel Cards and ID list)
  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ["stores", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return [];
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("org_id", activeOrg.id);
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrg?.id,
  });

  const storeIds = stores.map((s) => s.id);
  const targetStoreIds = isOrgView
    ? storeIds
    : activeStore
      ? [activeStore.id]
      : [];

  // 3. Fetch Orders (Core Data)
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["dashboard_orders", targetStoreIds, timeRange],
    queryFn: async () => {
      if (targetStoreIds.length === 0) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("store_id", targetStoreIds)
        .gte("ordered_at", startDateIso)
        .order("ordered_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: targetStoreIds.length > 0,
  });

  // 4. Fetch Order Items (For accurate Unit Sold count)
  // We optimize by fetching only items for the orders we already retrieved
  const orderIds = orders.map((o) => o.id);
  const { data: orderItems = [] } = useQuery({
    queryKey: ["dashboard_order_items", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);
      if (error) throw error;
      return data;
    },
    enabled: orderIds.length > 0,
  });

  // 5. Fetch Alerts
  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["dashboard_alerts", targetStoreIds],
    queryFn: async () => {
      if (targetStoreIds.length === 0) return [];
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .in("store_id", targetStoreIds)
        .eq("resolved", false) // Only show unresolved alerts
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: targetStoreIds.length > 0,
  });

  // 6. Fetch Inventory (All, limited)
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ["dashboard_inventory", targetStoreIds],
    queryFn: async () => {
      if (targetStoreIds.length === 0) return [];
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .in("store_id", targetStoreIds)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: targetStoreIds.length > 0,
  });

  // 7. Fetch Products (Limited)
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["dashboard_products", targetStoreIds],
    queryFn: async () => {
      if (targetStoreIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("store_id", targetStoreIds)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: targetStoreIds.length > 0,
  });

  // 8. Fetch Returns (Time filtered, limited)
  const { data: returnsData = [], isLoading: isLoadingReturns } = useQuery({
    queryKey: ["dashboard_returns", targetStoreIds, timeRange],
    queryFn: async () => {
      if (targetStoreIds.length === 0) return [];
      const { data, error } = await supabase
        .from("returns")
        .select("*")
        .in("store_id", targetStoreIds)
        .gte("created_at", startDateIso)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: targetStoreIds.length > 0,
  });

  // 9. Fetch Fulfillments (For the fetched orders)
  const { data: fulfillments = [] } = useQuery({
    queryKey: ["dashboard_fulfillments", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("fulfillments")
        .select("*")
        .in("order_id", orderIds);
      if (error) throw error;
      return data;
    },
    enabled: orderIds.length > 0,
  });

  // --- Aggregations (Memoization happens in component, but types prepared here) ---

  return {
    stores,
    orders,
    orderItems,
    alerts,
    inventory,
    products,
    returns: returnsData,
    fulfillments,
    isLoading:
      isLoadingStores ||
      isLoadingOrders ||
      isLoadingAlerts ||
      isLoadingInventory ||
      isLoadingProducts ||
      isLoadingReturns,
  };
}
