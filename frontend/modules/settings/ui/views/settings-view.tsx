"use client";

import { useQueryState } from "nuqs";
import { parseAsStringEnum } from "nuqs/server";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "../components/profile-settings";
import { OrganizationsList } from "../components/organizations-list";
import { useSettingsData } from "../../hooks/use-settings-data";
import type { SettingsTab } from "../../schema/schema";
import { Loader2 } from "lucide-react";
import { User, Building2 } from "lucide-react";
import { IconType } from "react-icons/lib";

const TAB_CONFIG: { value: SettingsTab; label: string; icon: IconType }[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "organizations", label: "Organizations", icon: Building2 },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useQueryState<SettingsTab>(
    "tab",
    parseAsStringEnum<SettingsTab>(["profile", "organizations"]).withDefault(
      "profile",
    ),
  );

  const { userProfile, organizations, isLoading } = useSettingsData();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account preferences and organization configurations.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SettingsTab)}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile">
              <ProfileSettings user={userProfile ?? null} />
            </TabsContent>

            <TabsContent value="organizations">
              <OrganizationsList organizations={organizations || []} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  );
}
