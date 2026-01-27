"use client";

import { MoreHorizontal, Shield, ShieldCheck, Trash2 } from "lucide-react";
import type { TeamMember } from "../../hooks/use-team-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TeamMembersTableProps {
  members: TeamMember[];
  onUpdateRole: (id: string, role: string) => void;
  onRemoveMember: (id: string) => void;
}

export function TeamMembersTable({
  members,
  onUpdateRole,
  onRemoveMember,
}: TeamMembersTableProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
        No team members found.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-scroll [&::-webkit-scrollbar]:hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50">
          <tr>
            <th className="h-12 px-4 font-medium text-left align-middle">
              User
            </th>
            <th className="h-12 px-4 font-medium text-left align-middle">
              Role
            </th>
            <th className="h-12 px-4 font-medium text-left align-middle">
              Joined At
            </th>
            <th className="h-12 px-4 font-medium text-right align-middle">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-t transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {/* Using member.id as src placeholder if no image available */}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {member.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </div>
                </div>
              </td>
              <td className="p-4 align-middle">
                <div
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    member.role === "admin"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  )}
                >
                  {member.role === "admin" ? (
                    <ShieldCheck className="mr-1 h-3 w-3" />
                  ) : (
                    <Shield className="mr-1 h-3 w-3" />
                  )}
                  {member.role}
                </div>
              </td>
              <td className="p-4 align-middle">
                {member.joined_at
                  ? new Date(member.joined_at).toLocaleDateString()
                  : "-"}
              </td>
              {member.role !== "admin" && (
                <td className="p-4 align-middle text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateRole(
                            member.id,
                            member.role === "admin" ? "member" : "admin",
                          )
                        }
                      >
                        {member.role === "admin" ? "Make Member" : "Make Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onRemoveMember(member.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
