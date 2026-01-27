"use client";
import { NotificationsPopover } from "@/modules/dashboard/ui/components/NotificationsPopover";
import { SettingsPopover } from "@/modules/dashboard/ui/components/SettingsPopover";
import { useNotifications } from "@/hooks/useNotifications";

const SidebarButtons = () => {
    const { notifications, loading } = useNotifications(20);

  return (
    <div className="flex items-center gap-2">
      <NotificationsPopover notifications={notifications} />
      <SettingsPopover />
    </div>
  );
};

export default SidebarButtons;
