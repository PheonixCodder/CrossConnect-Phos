"use client";

import * as React from "react";
import {
  Building2,
  Store as StoreIcon,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { useDashboardStore } from "@/store/useStore";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase.types";
import { Separator } from "../ui/separator";
import { NewOrgDialog } from "@/modules/dashboard/ui/components/NewOrganizationDialog";
import { getCurrentUserId } from "@/lib/helpers/getUser";
import { UserRow } from "@/modules/settings/hooks/use-settings-data";

// --- Type Safety Helpers ---
type Store = Database["public"]["Tables"]["stores"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type PlatformType = NonNullable<Store["platform"]>;

const PLATFORM_NAMES: Record<PlatformType, string> = {
  shopify: "Shopify",
  faire: "Faire",
  amazon: "Amazon",
  walmart: "Walmart",
  tiktok: "TikTok",
  warehance: "Warehance",
  target: "Target",
};

export function GlobalContextSwitcher() {
  const supabase = createClient();
  const {
    activeOrg,
    setOrganizations,
    setActiveOrg,
    activeStore,
    setStores,
    organizations,
    stores,
    setActiveStore,
  } = useDashboardStore();

  const [isOrgOpen, setIsOrgOpen] = React.useState(false);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = React.useState(false);
  const [isStoreOpen, setIsStoreOpen] = React.useState(false);

  const onOrgOpenChange = () => setIsOrgDialogOpen((prev) => !prev);

  // 1. Fetch Current User Profile
  const { data: userProfile } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const user = await getCurrentUserId();
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as UserRow;
    },
  });

  // 1. Fetch Organizations
  const { data: newOrganizations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*, organization_members!inner(role)")
        .eq("organization_members.user_id", userProfile?.id);
      if (error) throw error;
      setOrganizations(data ?? []);
      return data as Organization[];
    },
    enabled: !!userProfile?.id,
  });

  // 2. Fetch Stores (Dependent on activeOrg)
  const { data: newStores = [], isLoading: loadingStores } = useQuery({
    queryKey: ["stores", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return [];
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("org_id", activeOrg.id);
      if (error) throw error;
      setStores(data ?? []);
      return data as Store[];
    },
    enabled: !!activeOrg?.id,
  });

  // Group stores by platform for the UI
  const storesByPlatform = React.useMemo(() => {
    return stores.reduce(
      (acc, store) => {
        const platform = store.platform; // Fallback if null
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(store);
        return acc;
      },
      {} as Record<PlatformType, Store[]>,
    );
  }, [stores]);

  React.useEffect(() => {
    if (!activeOrg) {
      setActiveOrg(organizations[0]);
    }
  }, [activeOrg, organizations, setActiveOrg]);

  return (
    <div className="flex items-center gap-1 text-sm font-medium min-w-0">
      {/* Organization Selector */}
      <Popover open={isOrgOpen} onOpenChange={setIsOrgOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border bg-background">
              {loadingOrgs ? (
                <Loader2 className="lg:h-3 lg:w-3 h-1 animate-spin" />
              ) : (
                <Building2 className="h-3 w-3" />
              )}
            </div>
            <span className="max-w-[80px] sm:max-w-[140px] truncate">
              {activeOrg?.name || "Select Org"}
            </span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[200px] p-0 flex flex-col">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandGroup heading="Organizations">
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => {
                      setActiveOrg(org);
                      setIsOrgOpen(false);
                    }}
                  >
                    <Building2 className="mr-2 h-4 w-4 opacity-70" />
                    <span className="truncate">{org.name}</span>
                    {activeOrg?.id === org.id && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <Separator />
          <div className="p-2">
            <Button
              variant="header"
              className="w-full border justify-start text-xs font-normal hover:bg-primary/30"
              onClick={onOrgOpenChange}
            >
              Create new Organization
            </Button>
          </div>
          <NewOrgDialog open={isOrgDialogOpen} onOpenChange={onOrgOpenChange} />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground/30 text-lg">/</span>

      {/* Store Selector */}
      <Popover open={isStoreOpen} onOpenChange={setIsStoreOpen}>
        <PopoverTrigger asChild disabled={!activeOrg}>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border bg-background">
              {loadingStores ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <StoreIcon className="h-3 w-3" />
              )}
            </div>
            <span className="max-w-[120px] truncate">
              {activeStore?.name || "Select Store"}
            </span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[220px] p-0">
          <Command>
            <CommandInput placeholder="Search stores..." />
            <CommandList>
              {stores.length === 0 && !loadingStores && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No stores found.
                </div>
              )}

              {Object.entries(storesByPlatform).map(
                ([platform, platformStores]) => (
                  <CommandGroup
                    key={platform}
                    heading={
                      PLATFORM_NAMES[platform as PlatformType] || "Other"
                    }
                  >
                    {platformStores.map((s) => (
                      <CommandItem
                        key={s.id}
                        onSelect={() => {
                          setActiveStore(s);
                          setIsStoreOpen(false);
                        }}
                      >
                        <StoreIcon className="mr-2 h-4 w-4 opacity-70" />
                        <span className="truncate">{s.name}</span>
                        {activeStore?.id === s.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ),
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
