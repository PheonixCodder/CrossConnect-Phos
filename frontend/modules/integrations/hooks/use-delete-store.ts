"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";

type DeleteStoreInput = {
    storeId: string;
};

export function useDeleteStore() {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const activeOrgId = useDashboardStore((s) => s.activeOrg?.id);

    return useMutation({
        mutationFn: async ({ storeId }: DeleteStoreInput) => {
            console.log(storeId);
            const { error } = await supabase
                .from("stores")
                .delete()
                .eq("id", storeId)

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["stores", activeOrgId],
            });
        },
    });
}
