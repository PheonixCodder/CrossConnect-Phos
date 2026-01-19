import { PageContainer } from "@/components/layout/PageContainer";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IntegrationsView } from "@/modules/integrations/ui/views/integrations-view";
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
        <IntegrationsView />
      </div>
    </PageContainer>
  );
};

export default Page;
