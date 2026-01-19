"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (email: string, role: string) => void;
  isSubmitting: boolean;
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  onAddMember,
  isSubmitting,
}: AddTeamMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onAddMember(email, role);
    // Reset form on submit
    setEmail("");
    setRole("member");
  };

  return (
    <ResponsiveDialog
      title="Add Team Member"
      description="Invite a new member to join your organization."
      open={open}
      onOpenChange={onOpenChange}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={setRole} defaultValue="member">
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending Invite..." : "Send Invite"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}