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
import { encryptPayload } from "@/app/actions/credentials";
type PlatformType = Database["public"]["Enums"]["platform_types"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  isEdit: boolean;
  platform: PlatformType;
  existingCredentials:
    | Database["public"]["Tables"]["store_credentials"]["Row"]
    | null;
}

const getMissingFields = (
    fields: { key: string; label: string }[],
    data: Record<string, string>,
) =>
    fields.filter(
        (f) => !data[f.key] || data[f.key].trim().length === 0,
    );


export function CredentialDialog({
                                   open,
                                   onOpenChange,
                                   storeId,
                                   platform,
                                   isEdit,
                                   existingCredentials,
                                 }: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const config = CREDENTIALS_CONFIG[platform];

  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    queueMicrotask(() => {
      if (isEdit && existingCredentials?.credentials) {
        const raw = existingCredentials.credentials;
        const parsed =
            typeof raw === "string" ? JSON.parse(raw) : raw ?? {};
        setFormData(parsed as Record<string, string>);
      } else {
        setFormData({});
      }
    });
  }, [open, isEdit, existingCredentials]);

  const missingFields = getMissingFields(config.fields, formData);
  const isFormInvalid = missingFields.length > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      // 🔒 HARD SCHEMA GUARD
      if (missingFields.length > 0) {
        throw new Error(
            `Missing required field(s): ${missingFields
                .map((f) => f.label)
                .join(", ")}`,
        );
      }

      // Shopify OAuth redirect
      if (platform === "shopify") {
        const shopDomain = formData["shopDomain"];
        const clientId = formData["shopifyClientId"];
        const clientSecret = formData["shopifyClientSecret"];

        const cleanDomain = shopDomain
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "");
        const encryptedCredentials = await encryptPayload({
          shopifyClientId: clientId,
          shopifyClientSecret: clientSecret,
          shopDomain: cleanDomain,
        });

        // Upsert credentials BEFORE redirect
        await supabase.from("store_credentials").upsert({
          store_id: storeId,
          credentials: encryptedCredentials,
          updated_at: new Date().toISOString(),
        });

        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/shopify?storeId=${storeId}&shop=${cleanDomain}`;
        return;
      }

      // Warehance validation + fetch
      if (platform === "warehance") {
        const apiKey = formData["WAREHANCE_API_KEY"];

        const res = await fetch("/api/warehance", {
          method: "POST",
          body: JSON.stringify({ apiKey, storeId }),
        });

        const data = await res.json();
        if (data.ok === "false") {
          throw new Error("Failed fetching Warehance stores");
        }
      }

      const encryptedCredentials = await encryptPayload(formData);

      if (isEdit) {
        const { error } = await supabase
            .from("store_credentials")
            .update({
              credentials: encryptedCredentials,
              updated_at: new Date().toISOString(),
            })
            .eq("store_id", storeId);
        if (error) throw new Error(`Failed to update credentials: ${error.message}`);
      } else {
        const { error } = await supabase.from("store_credentials").insert({
          store_id: storeId,
          credentials: encryptedCredentials,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) throw new Error(`Failed to update credentials: ${error.message}`);

        if (platform !== "warehance") {
          await supabase
              .from("stores")
              .update({ auth_status: "active" })
              .eq("id", storeId);
        }
      }
    },
    onSuccess: async () => {
      if (platform !== "shopify") {
        toast.success("Credentials saved");

        if (platform === "walmart") {
          await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/walmart/connect/${storeId}`,
              { method: "POST" },
          );
        }

        await queryClient.invalidateQueries({queryKey: ["stores"]});
        onOpenChange(false);
      }
    },
    onError: (error) =>
        toast.error(error.message || "Failed to save credentials"),
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
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                <Input
                    type={f.type}
                    value={formData[f.key] ?? ""}
                    onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          [f.key]: e.target.value,
                        }))
                    }
                    required
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

            <Button
                type="submit"
                disabled={mutation.isPending || isFormInvalid}
            >
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
