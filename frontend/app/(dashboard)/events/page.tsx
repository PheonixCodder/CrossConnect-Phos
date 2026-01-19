import { PageContainer } from "@/components/layout/PageContainer";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EventsView } from "@/modules/events/ui/views/events-view";

const Page = () => {
  return (
    <PageContainer
      maxWidth="2xl"
      padding="lg"
      className="py-6 space-y-6 h-[calc(100vh-11vh)]"
    >
      <div>
        <SidebarTrigger className="h-9 w-9 -ml-1.5" />
        <EventsView />
      </div>
    </PageContainer>
  );
};

export default Page;
