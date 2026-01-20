"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Building2, Check } from "lucide-react";
import type { OrganizationRow } from "../../hooks/use-settings-data";
import { GeneralSettings } from "./general-settings";
import { useDashboardStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

interface OrganizationsListProps {
  organizations: Array<OrganizationRow & { organization_members: { role: string } }>;
}

export function OrganizationsList({ organizations }: OrganizationsListProps) {
  const activeOrgId = useDashboardStore((state) => state.activeOrg?.id);
  // Default to the active organization, or the first one
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    activeOrgId || organizations[0]?.id || null
  );

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] lg:h-[650px]">
      {/* Left Side: List of Organizations */}
      <Card className="col-span-1 flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Select an organization to manage settings.</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrgId(org.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-md text-left transition-colors border hover:bg-accent",
                  selectedOrgId === org.id ? "bg-accent border-primary" : "border-transparent"
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">{org.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {org.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {org.id === activeOrgId && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 capitalize">
                    {org.organization_members.role}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-muted/20 text-xs text-center text-muted-foreground">
            Edit settings locally without switching dashboard context.
        </div>
      </Card>

      {/* Right Side: General Settings for Selected Org */}
      <Card className="col-span-1 lg:col-span-2 h-full overflow-y-auto">
        {selectedOrg ? (
          <GeneralSettings key={selectedOrg.id} organization={selectedOrg} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-20" />
            <p>Select an organization to view settings</p>
          </div>
        )}
      </Card>
    </div>
  );
}