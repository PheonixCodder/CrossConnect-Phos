import { AppSidebar } from "@/modules/dashboard/ui/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React, { ReactNode } from "react";
import { GlobalContextSwitcher } from "@/components/layout/orgs-selector";
import SidebarButtons from "@/components/layout/SidebarButtons";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: ReactNode }) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="bg-primary-foreground">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 60)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar user={user} variant="inset" />
        <div className="m-2 w-[97%]">
          <div className="flex justify-between py-2 my-2 px-4 md:px-12 rounded-xl bg-[#0e0c0c]">
            <GlobalContextSwitcher />
            <SidebarButtons />
          </div>
          <SidebarInset className="bg-[#0e0c0c]">{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Layout;
