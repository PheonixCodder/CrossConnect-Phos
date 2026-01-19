import { PageContainer } from "@/components/layout/PageContainer";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AlertsView } from "@/modules/notifications/ui/views/alerts-view";
import React from "react";

const Page = () => {
  return (
    <PageContainer
      maxWidth="2xl"
      padding="lg"
      className="py-6 space-y-6 h-[calc(100vh-11vh)]"
    >
      <div>
        <SidebarTrigger className="h-9 w-9 -ml-1.5" />
        <AlertsView />
      </div>
    </PageContainer>
  );
};

export default Page;
