"use client";
import * as React from "react";
import {
  IconBrandWalmart,
  IconDashboard,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { NavMain } from "@/modules/dashboard/ui/components/NavMain";
import { NavSecondary } from "@/modules/dashboard/ui/components/NavSecondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FaAmazon, FaShopify } from "react-icons/fa";
import { User } from "@supabase/supabase-js";
import { getFirstTwoLetters } from "@/lib/shortenName";
import { Bell, SquareMousePointer, TargetIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchCommand } from "@/components/layout/SearchCommand";
import { useSidebar } from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Shopify",
      icon: FaShopify,
      isActive: true,
      url: "/integrations",
    },
    {
      title: "Amazon",
      icon: FaAmazon,
      url: "/integrations",
    },
    {
      title: "Walmart",
      icon: IconBrandWalmart,
      url: "/integrations",
    },
    {
      title: "Warehance",
      icon: "/images/warehance-gray.svg",
      hover: "/images/warehance-white.svg",
      url: "/integrations",
    },
    {
      title: "Faire",
      icon: "/images/faire-gray.svg",
      hover: "/images/faire-white.svg",
      url: "/integrations",
    },
    {
      title: "Target",
      icon: TargetIcon,
      url: "/integrations",
    },
  ],
  navSecondary: [
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
  monitoring: [
    {
      title: "Events",
      url: "/events",
      icon: SquareMousePointer,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const { setOpenMobile: sidebarSetOpen, isMobile } = useSidebar();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const platform = searchParams.get("platform");

  const toggleCommand = React.useCallback(
    () => setOpen((prevState) => !prevState),
    [],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommand();
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [toggleCommand]);
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-2! hover:bg-primary/5"
            >
              <Link href="/">
                <IconInnerShadowTop className="size-5! text-primary" />
                <div className="flex flex-col items-start">
                  <span className="text-base font-bold tracking-tight">
                    CrossConnect
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className="mt-6 mb-4 px-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Apps & Integrations
          </h3>
          <div className="space-y-1">
            {data.navClouds.map((item) => (
              <SidebarMenu key={item.title}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    onClick={() => {
                      if (isMobile) sidebarSetOpen(false);
                    }}
                    className={cn(
                      platform === item.title.toLowerCase() &&
                        "bg-primary/10 text-primary",
                      "hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
                    )}
                  >
                    <Link
                      href={`${item.url}?platform=${item.title.toLowerCase()}`}
                    >
                      {typeof item.icon === "string" ? (
                        <img src={item.icon} width={18} alt="icon" />
                      ) : (
                        <item.icon className="size-4!" />
                      )}
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ))}
          </div>
        </div>
        <div className="mt-6 mb-4 px-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Monitoring
          </h3>
          <div className="space-y-1">
            {data.monitoring.map((item) => (
              <SidebarMenu key={item.title}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    onClick={() => {
                      if (isMobile) sidebarSetOpen(false);
                    }}
                    className={cn(
                      pathname === item.url && "bg-primary/10 text-primary",
                      "hover:bg-primary/5",
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ))}
          </div>
        </div>
        <NavSecondary
          onSearchClick={toggleCommand}
          items={data.navSecondary}
          className="mt-auto"
        />
        <SearchCommand open={open} setOpen={toggleCommand} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {getFirstTwoLetters(user.user_metadata.full_name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.user_metadata.full_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconSettings className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
