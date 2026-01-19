import { PageContainer } from "@/components/layout/PageContainer";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SettingsView } from "@/modules/settings/ui/views/settings-view";
import React from "react";

const Page = () => {
  return (
    <PageContainer
      maxWidth="2xl"
      padding="lg"
      className="py-6 space-y-6"
    >
      <div>
        <SidebarTrigger className="h-9 w-9 -ml-1.5" />
        <SettingsView />
      </div>
    </PageContainer>
  );
};

export default Page;
