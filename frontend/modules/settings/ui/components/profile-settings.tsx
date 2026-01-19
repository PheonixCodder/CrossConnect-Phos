"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import type { UserRow } from "../../hooks/use-settings-data";

interface ProfileSettingsProps {
  user: UserRow | null;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || "");
  
  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mutation: Update Name
  const { mutate: updateName, isPending: isUpdatingName } = useMutation({
    mutationFn: async (newName: string) => {
      if (!user?.id) throw new Error("User not found");
      const { error } = await supabase
        .from("users")
        .update({ full_name: newName, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
      toast.success("Profile name updated");
    },
    onError: () => toast.error("Failed to update name"),
  });

  // Mutation: Update Password
  const { mutate: updatePassword, isPending: isUpdatingPassword } = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update password");
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateName(fullName);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    updatePassword(newPassword);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Name Section */}
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>
            This information will be displayed on your team members dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={isUpdatingName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                Your email address is managed by Supabase Auth and cannot be changed here.
              </p>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isUpdatingName || !fullName}>
                {isUpdatingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button 
                type="submit" 
                variant="secondary" 
                disabled={isUpdatingPassword || !currentPassword || !newPassword}
              >
                {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}