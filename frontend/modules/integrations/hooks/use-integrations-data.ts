"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";
import type { Database } from "@/types/supabase.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type CredentialRow =
  Database["public"]["Tables"]["store_credentials"]["Row"];

export type StoreWithCredentials = StoreRow & {
  store_credentials: CredentialRow | null;
};

export function useIntegrationsData(
  platform: Database["public"]["Enums"]["platform_types"] | null
) {
  const supabase = createClient();
  const activeOrgId = useDashboardStore((s) => s.activeOrg?.id);

  return useQuery({
    queryKey: ["stores", activeOrgId, platform],
    enabled: !!activeOrgId,
    queryFn: async (): Promise<StoreWithCredentials[]> => {
      if (!activeOrgId) return [];

      const query = supabase
        .from("stores")
        .select("*, store_credentials!left(*)")
        .eq("org_id", activeOrgId);

      if (platform) {
        query.eq("platform", platform);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as StoreWithCredentials[];
    },
  });
}
