"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { useQueryState } from "nuqs";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTeamData } from "@/modules/team/hooks/use-team-data";
import { TeamMembersTable } from "../components/team-members-table";
import { AddTeamMemberDialog } from "../components/add-team-member-dialog";

export function TeamsView() {
  // --- URL State Management with nuqs ---
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    throttleMs: 500,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Since the hook abstracts the mutation state, we'll use local state
  // for UI feedback in the dialog (e.g. button loading state)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { members, isLoading, addMember, removeMember, updateRole } =
    useTeamData();

  // --- Client-side Filtering ---
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lowerQuery = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.full_name?.toLowerCase().includes(lowerQuery) ||
        member.email.toLowerCase().includes(lowerQuery),
    );
  }, [members, searchQuery]);

  const handleAddMember = async (email: string, role: string) => {
    setIsSubmitting(true);
    try {
      // Note: The hook uses mutate() which is void, so we assume success after a short delay
      // or rely on the toast notification from the hook for error handling.
      addMember(email, role);

      // Close dialog immediately for better UX, or keep open if you prefer
      setTimeout(() => {
        setIsAddDialogOpen(false);
        setIsSubmitting(false);
      }, 500);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Team</h2>
            <p className="text-muted-foreground">
              Manage your team members and permissions.
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="flex items-center space-x-2">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            Loading team...
          </div>
        ) : (
          <TeamMembersTable
            members={filteredMembers}
            onUpdateRole={updateRole}
            onRemoveMember={removeMember}
          />
        )}

        {/* Add Member Dialog */}
        <AddTeamMemberDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddMember={handleAddMember}
          isSubmitting={isSubmitting}
        />
      </div>
    </PageContainer>
  );
}
