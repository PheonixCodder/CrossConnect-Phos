import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import React, { ReactNode } from 'react'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className='bg-primary-foreground'>
      <SidebarProvider style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
            <AppSidebar variant="inset" />
                  <SidebarInset className='bg-[#0e0c0c] max-h-[cal(100vh - 5vh)]'>
            {children}
            </SidebarInset>
    </SidebarProvider>
    </div>
  )
}

export default Layout