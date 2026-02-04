"use client";

import NotificationsPopover from "@/modules/dashboard/ui/components/NotificationsPopover";
import { SettingsPopover } from "@/modules/dashboard/ui/components/SettingsPopover";
import { useNotifications } from "@/hooks/useNotifications";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";
import { toast } from "sonner";

const SidebarButtons = () => {
    const supabase = createClient();
    const { notifications, loading, refetch } = useNotifications(20);
    const { activeStore, activeOrg, stores } = useDashboardStore();

    const markAllResolved = async () => {
        const supabase = createClient();

        const storeIds =
            activeStore?.id
                ? [activeStore.id]
                : activeOrg?.id
                    ? stores.map((s) => s.id)
                    : [];

        if (storeIds.length === 0) return;

        const { error } = await supabase
            .from("alerts")
            .update({
                resolved: true,
                resolved_at: new Date().toISOString(),
            })
            .in("store_id", storeIds)
            .select()
            .eq("resolved", false);

        if (error) {
            toast.error("Failed to mark notifications as read");
            return;
        }

        toast.success("All notifications marked as read");
        refetch();
    };


    return (
        <div className="flex items-center gap-2">
            <NotificationsPopover
                notifications={notifications}
                onMarkAllRead={markAllResolved}
            />
            <SettingsPopover />
        </div>
    );
};

export default SidebarButtons;
