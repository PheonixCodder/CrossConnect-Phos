import { create } from "zustand";
import type { Database } from "@/types/supabase.types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type Store = Database["public"]["Tables"]["stores"]["Row"];

interface DashboardState {
  organizations: Organization[];
  stores: Store[];

  activeOrg: Organization | null;
  activeStore: Store | null;

  setOrganizations: (orgs: Organization[]) => void;
  setStores: (stores: Store[]) => void;

  setActiveOrg: (org: Organization | null) => void;
  setActiveStore: (store: Store | null) => void;

  resetStores: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  organizations: [],
  stores: [],

  activeOrg: null,
  activeStore: null,

  setOrganizations: (organizations) => set({ organizations }),
  setStores: (stores) => set({ stores }),

  setActiveOrg: (org) =>
    set({
      activeOrg: org,
      activeStore: null, // CRITICAL: reset store when org changes
      stores: [],
    }),

  setActiveStore: (store) => set({ activeStore: store }),

  resetStores: () =>
    set({
      stores: [],
      activeStore: null,
    }),
}));
