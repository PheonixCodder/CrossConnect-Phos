"use client";
import * as React from "react";
import { type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useSidebar } from "@/components/ui/sidebar";

export function NavSecondary({
  items,
  onSearchClick,
  ...props
}: {
  onSearchClick: () => void;
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { setOpenMobile, isMobile } = useSidebar();
  const pathname = usePathname();
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              key={item.title}
              onClick={() => {
                if (isMobile && item.title !== "Search") setOpenMobile(false);
              }}
            >
              <SidebarMenuButton
                tooltip={item.title}
                className={cn(
                  pathname === item.url && "bg-primary/10 text-primary",
                  "hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
                )}
                asChild
              >
                {item.title === "Search" ? (
                  <div
                    onClick={onSearchClick}
                    className="flex items-center cursor-pointer justify-between"
                  >
                    <div className="flex items-center cursor-pointer gap-2">
                      <item.icon className="size-4" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <KbdGroup className="text-gray-700">
                      <Kbd>Ctrl</Kbd>
                      <span>+</span>
                      <Kbd>K</Kbd>
                    </KbdGroup>
                  </div>
                ) : (
                  <Link href={item.url}>
                    <item.icon className="size-4" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
