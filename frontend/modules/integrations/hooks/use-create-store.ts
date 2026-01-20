"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";
import type { Database } from "@/types/supabase.types";

type PlatformType = Database["public"]["Enums"]["platform_types"];

interface CreateStoreInput {
  name: string;
  platform: PlatformType;
}

export function useCreateStore() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const activeOrgId = useDashboardStore((s) => s.activeOrg?.id);

  return useMutation({
    mutationFn: async ({ name, platform }: CreateStoreInput) => {
      if (!activeOrgId) {
        throw new Error("Active organization missing");
      }

      const { error } = await supabase.from("stores").insert({
        name,
        platform,
        org_id: activeOrgId,
        auth_status: "inactive",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
