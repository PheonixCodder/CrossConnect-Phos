import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Database } from '@/types/supabase.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type Store = Database['public']['Tables']['stores']['Row'];

interface DashboardState {
  // Data lists
  organizations: Organization[];
  stores: Store[]; // Stores belonging to the active organization
  
  // Selections
  activeOrg: Organization | null;
  activeStore: Store | null;

  // Actions
  setOrganizations: (orgs: Organization[]) => void;
  setStores: (stores: Store[]) => void;
  
  setActiveOrg: (org: Organization) => void;
  setActiveStore: (store: Store) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      organizations: [],
      stores: [],
      activeOrg: null,
      activeStore: null,

      setOrganizations: (organizations) => set({ organizations }),
      setStores: (stores) => set({ stores }),

      setActiveOrg: (activeOrg) => set({ 
        activeOrg, 
        activeStore: null, // Reset store when switching organization
        stores: [] // Clear stores until new ones are fetched for this org
      }),
      setActiveStore: (activeStore) => set({ activeStore }),
    }),
    { name: 'dashboard-context' }
  )
);
