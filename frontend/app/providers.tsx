"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider as NextThemesProvider } from "next-themes"


export function Providers({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props} >
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
      </NextThemesProvider>
  )
}
