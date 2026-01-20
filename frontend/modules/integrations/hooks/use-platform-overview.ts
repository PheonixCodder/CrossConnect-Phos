"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";
import type { Database } from "@/types/supabase.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type PlatformType = Database["public"]["Enums"]["platform_types"];

export interface PlatformOverview {
  platform: PlatformType;
  totalStores: number;
  activeStores: number; // Stores with auth_status = 'active'
  lastSync: string | null;
  trend: number; // Calculated or placeholder
  share: number; // Percentage of total stores
}

export function usePlatformOverview() {
  const supabase = createClient();
  const activeOrgId = useDashboardStore((state) => state.activeOrg?.id);

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores", activeOrgId],
    queryFn: async (): Promise<StoreRow[]> => {
      if (!activeOrgId) return [];
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("org_id", activeOrgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrgId,
  });

  const platformsData = useMemo(() => {
    if (!stores) return [];

    const platformMap = new Map<PlatformType, PlatformOverview>();

    const allPlatforms: PlatformType[] = [
      "shopify",
      "faire",
      "amazon",
      "walmart",
      "tiktok",
      "warehance",
      "target",
    ];

    // Initialize all platforms with 0
    allPlatforms.forEach((p) => {
      platformMap.set(p, {
        platform: p,
        totalStores: 0,
        activeStores: 0,
        lastSync: null,
        trend: 0,
        share: 0,
      });
    });

    // Calculate aggregates
    let totalStoresCount = 0;

    stores.forEach((store) => {
      const current = platformMap.get(store.platform as PlatformType);
      if (current) {
        current.totalStores++;
        if (store.auth_status === "active") {
          current.activeStores++;
        }
        
        // Update Last Sync (most recent in the platform)
        const storeSync = store.last_health_check;
        if (storeSync && (!current.lastSync || new Date(storeSync) > new Date(current.lastSync))) {
          current.lastSync = storeSync;
        }
      }
      totalStoresCount++;
    });

    // Calculate Share
    const result = Array.from(platformMap.values()).map((p) => ({
      ...p,
      share: totalStoresCount > 0 ? (p.totalStores / totalStoresCount) * 100 : 0,
    }));

    return result;
  }, [stores]);

  return { platforms: platformsData, isLoading };
}