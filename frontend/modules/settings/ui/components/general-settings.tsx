"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { OrganizationRow } from "../../hooks/use-settings-data";

interface GeneralSettingsProps {
  organization: OrganizationRow;
}

export function GeneralSettings({ organization }: GeneralSettingsProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [name, setName] = useState(organization.name);

  const { mutate: updateOrg, isPending } = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase
        .from("organizations")
        .update({ name: newName })
        .eq("id", organization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate the active org query to update the header context if needed
      queryClient.invalidateQueries({ queryKey: ["organizations"] });

      toast.success("Organization updated successfully");
    },
    onError: () => {
      toast.error("Failed to update organization");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Organization name cannot be empty");
      return;
    }
    updateOrg(name);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Manage this organization&apos;s public profile and details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              disabled={isPending}
            />
          </div>

          {/* Read-only Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-id">Organization ID</Label>
              <Input
                id="org-id"
                value={organization.id}
                disabled
                className="bg-muted text-muted-foreground font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-created">Created On</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background text-muted-foreground items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {organization.created_at
                  ? new Date(organization.created_at).toLocaleDateString()
                  : "Unknown"}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  );
}
