"use client";

import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/types/supabase.types";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/helpers/getUser";

export type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type OrganizationMemberRow = Database["public"]["Tables"]["organization_members"]["Row"];
export type MemberWithUser = OrganizationMemberRow & {
  // The property name "users" matches the Supabase table name used in the select query
  // We use | null because the relationship might not find a matching user
  users: UserRow | null;
};



export function useSettingsData() {
  const supabase = createClient();

  // 1. Fetch Current User Profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
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

  // 2. Fetch All Organizations the user has access to
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const user = await getCurrentUserId();
      if (!user) return [];

      // Join organizations with organization_members to filter for this user
      const { data, error } = await supabase
        .from("organizations")
        .select("*, organization_members!inner(role)")
        .eq("organization_members.user_id", user.id);
      if (error) throw error;
      return data as (OrganizationRow & {
        organization_members: { role: string };
      })[];
    },
  });

  return {
    userProfile,
    organizations,
    isLoading: isLoadingProfile || isLoadingOrgs,
  };
}
