"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CREDENTIALS_CONFIG } from "../../schema/schema";
import type { Database } from "@/types/supabase.types";

type PlatformType = Database["public"]["Enums"]["platform_types"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  platform: PlatformType;
  existingCredentials:
    | Database["public"]["Tables"]["store_credentials"]["Row"]
    | null;
}

export function CredentialDialog({
  open,
  onOpenChange,
  storeId,
  platform,
  existingCredentials,
}: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const config = CREDENTIALS_CONFIG[platform];
  const isEdit = !!existingCredentials;

  console.log(existingCredentials);

  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    queueMicrotask(() => {
      if (isEdit && existingCredentials?.credentials) {
        setFormData(
          JSON.parse(existingCredentials.credentials as string) as Record<string, string>,
        );
      } else {
        setFormData({});
      }
    });
  }, [open, isEdit, existingCredentials]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        await supabase
          .from("store_credentials")
          .update({
            credentials: formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCredentials!.id);
      } else {
        await supabase.from("store_credentials").insert({
          store_id: storeId,
          credentials: formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      toast.success("Credentials saved");
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to save credentials"),
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${isEdit ? "Edit" : "Add"} Credentials`}
      description={`Configure API credentials for ${config.label}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        {config.fields.map((f) => (
          <div key={f.key}>
            <Label className="mb-4">{f.label}</Label>
            <Input
              type={f.type}
              value={formData[f.key] ?? ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  [f.key]: e.target.value,
                }))
              }
            />
          </div>
        ))}

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
            Save
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
