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
    <div className="min-h-screen">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 60)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar user={user} variant="inset" />
        <div className="flex flex-col w-full min-h-screen">
          <div className="flex justify-between py-2 mt-6 mx-3 md:mx-6 px-3 sm:px-6 md:px-12 rounded-xl bg-[#0e0c0c]">
            <GlobalContextSwitcher />
            <SidebarButtons />
          </div>
          <main className="flex-1 overflow-y-auto p-3 sm:p-6">
            <SidebarInset className="bg-[#0e0c0c] rounded-xl p-4 sm:p-6">
              {children}
            </SidebarInset>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Layout;

// const Layout = async ({ children }: { children: ReactNode }) => {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) redirect("/signin");

//   return (
//     <div className="min-h-screen bg-primary-foreground">
//       <SidebarProvider
//         style={
//           {
//             "--sidebar-width": "16rem",
//             "--header-height": "3rem",
//           } as React.CSSProperties
//         }
//       >
//         <AppSidebar user={user} variant="inset" />

//         {/* Main column */}
//         <div className="flex flex-col w-full min-h-screen">
//           {/* Header */}
//           <header className="sticky top-0 z-20 bg-[#0e0c0c] border-b border-border px-3 sm:px-6">
//             <div className="flex items-center justify-between h-12 gap-2">
//               <GlobalContextSwitcher />
//               <SidebarButtons />
//             </div>
//           </header>

//           {/* Content */}
//           <main className="flex-1 overflow-y-auto p-3 sm:p-6">
//             <SidebarInset className="bg-[#0e0c0c] rounded-xl p-4 sm:p-6">
//               {children}
//             </SidebarInset>
//           </main>
//         </div>
//       </SidebarProvider>
//     </div>
//   );
// };
