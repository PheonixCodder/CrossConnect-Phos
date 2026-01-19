import { useMemo } from "react";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandResponsiveDialog,
} from "@/components/ui/command";
import { useDashboardStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Building2, Check, Store, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/types/supabase.types";

// --- Types ---
type Store = Database["public"]["Tables"]["stores"]["Row"];
type PlatformType = NonNullable<Store["platform"]>;

// --- Constants ---
const PLATFORM_NAMES: Record<PlatformType, string> = {
  shopify: "Shopify",
  faire: "Faire",
  amazon: "Amazon",
  walmart: "Walmart",
  tiktok: "TikTok",
  warehance: "Warehance",
  target: "Target",
};

type SearchCommandProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const SearchCommand = ({ open, setOpen }: SearchCommandProps) => {
  const supabase = createClient();
  const {
    // We no longer need to destructure 'stores' here for rendering
    activeOrg,
    organizations,
    activeStore,
    setActiveOrg,
    setActiveStore,
    setStores, // Keep this to update the global store
  } = useDashboardStore();

  // --- 1. Fetch Stores Logic ---
  // We rely on the returned 'data' for rendering, NOT the Zustand store.
  const { isLoading: isLoadingStores, data: queryStores } = useQuery({
    queryKey: ["stores", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return [];
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("org_id", activeOrg.id);
      if (error) throw error;

      // Still update the global store so the Header/Context Switcher stays in sync
      setStores(data ?? []);
      return data;
    },
  });

  // Use the query data for local rendering.
  // This guarantees that when activeOrg changes, data becomes undefined momentarily (while fetching),
  // preventing the "ghost data" from the previous org from showing up.
  const storesToRender = useMemo(() => queryStores || [], [queryStores]);

  // Group stores by platform
  const storesByPlatform: [[PlatformType: Store]] = useMemo(() => {
    return storesToRender.reduce(
      (acc, store) => {
        const platform = store.platform || "shopify";
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(store);
        return acc;
      },
      {} as Record<PlatformType, Store[]>,
    );
  }, [storesToRender]);

  const handleOrgSelect = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setActiveOrg(org);
      // NOTE: We do NOT close the dialog.
      // This allows the user to see the list update.
    }
  };

  const handleStoreSelect = (storeId: string) => {
    // We must find the store in the query data (storesToRender)
    // because the global store might be lagging behind slightly
    const store = storesToRender.find((s) => s.id === storeId);
    if (store) {
      setActiveStore(store);
      setOpen(false);
    }
  };

  return (
    <CommandResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={true}
    >
      <CommandInput placeholder="Jump to organization or store..." />
      <CommandList>
        {/* Organizations Section */}
        <CommandGroup heading="Organizations">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">
              No organizations found.
            </span>
          </CommandEmpty>
          {organizations.map((org) => (
            <CommandItem
              key={org.id}
              value={org.name}
              onSelect={() => handleOrgSelect(org.id)}
            >
              <Building2 className="mr-2 h-4 w-4 opacity-70" />
              <span className="flex-1">{org.name}</span>
              {activeOrg?.id === org.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Stores Section */}
        {activeOrg && (
          <>
            {isLoadingStores ? (
              <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading stores...
              </div>
            ) : Object.keys(storesByPlatform).length > 0 ? (
              Object.entries(storesByPlatform).map(
                ([platform, platformStores]) => (
                  <CommandGroup
                    key={platform}
                    heading={
                      PLATFORM_NAMES[platform as PlatformType] || "Other"
                    }
                  >
                    {platformStores.map((store: Store) => (
                      <CommandItem
                        key={store.id}
                        value={`${store.name} ${PLATFORM_NAMES[platform as PlatformType]}`}
                        onSelect={() => handleStoreSelect(store.id)}
                      >
                        <Store className="mr-2 h-4 w-4 opacity-70" />
                        <span className="flex-1 truncate">{store.name}</span>
                        {activeStore?.id === store.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ),
              )
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No stores found for this organization.
              </div>
            )}
          </>
        )}
      </CommandList>
    </CommandResponsiveDialog>
  );
};
