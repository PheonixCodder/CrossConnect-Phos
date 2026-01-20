"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateStore } from "../../hooks/use-create-store";
import type { Database } from "@/types/supabase.types";

type PlatformType = Database["public"]["Enums"]["platform_types"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: PlatformType;
}

export function AddStoreDialog({ open, onOpenChange, platform }: Props) {
  const [name, setName] = useState("");
  const mutation = useCreateStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutation.mutate(
      { name, platform },
      {
        onSuccess: () => {
          toast.success("Store created");
          setName("");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to create store");
        },
      }
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Store"
      description={`Create a new ${platform} store`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="mb-4">Store Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Store"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
