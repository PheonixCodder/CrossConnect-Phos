import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";
import type { Database } from "@/types/supabase.types";

type Store = Database["public"]["Tables"]["stores"]["Row"];

export function useStores(orgId?: string) {
  const supabase = createClient();
  const setStores = useDashboardStore((s) => s.setStores);

  return useQuery<Store[]>({
    queryKey: ["stores", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("org_id", orgId);

      if (error) throw error;

      setStores(data ?? []);
      return data ?? [];
    },
  });
}
