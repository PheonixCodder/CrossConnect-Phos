"use client";
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    badge?: string;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem className="mb-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="px-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </h3>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  className="hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  asChild
                >
                  <a href={item.url}>
                    {item.icon && <item.icon className="!size-4" />}
                    <span className="text-sm">{item.title}</span>
                    {item.badge && (
                      <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5">
                        {item.badge}
                      </Badge>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}