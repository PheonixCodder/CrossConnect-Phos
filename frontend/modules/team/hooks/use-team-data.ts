"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/supabase.types";
import { toast } from "sonner"; // Assuming you use sonner based on providers.ts
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/useStore";

// Types derived from your Schema
type OrganizationMemberRow =
  Database["public"]["Tables"]["organization_members"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

// A flattened type for easier UI consumption
export type TeamMember = UserRow & OrganizationMemberRow;

export function useTeamData() {
  const queryClient = useQueryClient();

  const supabase = createClient()

  // 1. Fetch the current Organization ID
  const orgId = useDashboardStore(state => state.activeOrg?.id)

  // 2. Fetch Team Members
  // We join 'organization_members' with 'users' using the foreign key
  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team_members", orgId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select("*, users(*)")
        .eq("org_id", orgId);

      if (error) throw new Error(error.message);

      // Flatten the data to merge user details with membership details
      return (
        data?.map((member) => ({
          ...member.users,
          ...member,
        })) ?? []
      );
    },
    enabled: !!orgId, // Only run query if we have an orgId
  });

  // 3. Mutation: Add Member
  // Since the UI passes an email, we first fetch the user ID, then insert the member record.
  const addMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!orgId) throw new Error("Organization ID is missing");

      // Step A: Find user by email
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (userError || !user) {
        throw new Error("User with this email not found.");
      }

      // Step B: Insert into organization_members
      const { error: insertError } = await supabase
        .from("organization_members")
        .insert({
          org_id: orgId,
          user_id: user.id,
          role: role,
        })
        .select()
        .single();

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      // Invalidate the members list to refetch
      queryClient.invalidateQueries({ queryKey: ["team_members", orgId] });
      toast.success("Member added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 4. Mutation: Remove Member
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!orgId) throw new Error("Organization ID is missing");

      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("org_id", orgId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members", orgId] });
      toast.success("Member removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 5. Mutation: Update Role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!orgId) throw new Error("Organization ID is missing");

      const { error } = await supabase
        .from("organization_members")
        .update({ role })
        .eq("org_id", orgId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members", orgId] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    members,
    isLoading,
    error,
    addMember: (email: string, role: string) =>
      addMemberMutation.mutate({ email, role }),
    removeMember: (userId: string) => removeMemberMutation.mutate(userId),
    updateRole: (userId: string, role: string) =>
      updateRoleMutation.mutate({ userId, role }),
  };
}
