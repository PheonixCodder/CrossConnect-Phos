"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";

type RenameStoreInput = {
    storeId: string;
    name: string;
};

export function useRenameStore() {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const activeOrgId = useDashboardStore((s) => s.activeOrg?.id);

    return useMutation({
        mutationFn: async ({ storeId, name }: RenameStoreInput) => {
            const trimmedName = name.trim();

            if (!trimmedName) {
                throw new Error("Store name cannot be empty");
            }

            const { error } = await supabase
                .from("stores")
                .update({ name: trimmedName })
                .eq("id", storeId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["stores", activeOrgId],
            });
        },
    });
}
