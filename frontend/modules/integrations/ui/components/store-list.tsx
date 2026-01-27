"use client";

import {
  ChevronLeft,
  Loader2,
  Key,
  ShieldCheck,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StoreWithCredentials } from "../../hooks/use-integrations-data";
import { CredentialDialog } from "./credential-dialog";
import { useState } from "react";
import type { Database } from "@/types/supabase.types";
import { cn } from "@/lib/utils";
import { AddStoreDialog } from "./add-store-dialog";

interface StoreListProps {
  platform: Database["public"]["Enums"]["platform_types"];
  stores: StoreWithCredentials[];
  isLoading: boolean;
  onBack: () => void;
}

export function StoreList({
  platform,
  stores,
  isLoading,
  onBack,
}: StoreListProps) {
  const [selectedStore, setSelectedStore] =
    useState<StoreWithCredentials | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const handleManageCredentials = (store: StoreWithCredentials) => {
    setSelectedStore(store);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold capitalize truncate">
              {platform} Stores
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              Manage credentials and status for your {platform} integrations.
            </p>
          </div>
        </div>
        <div className="flex w-full justify-end">
          <Button
            className="flex items-center justify-center min-w-[120px]"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        </div>
      </div>

      <AddStoreDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        platform={platform}
      />

      {/* Store Grid */}
      <div className="grid grid-cols-1 gap-4">
        {stores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <AlertCircle className="h-6 w-6 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No {platform} stores found.
              </p>
            </CardContent>
          </Card>
        ) : (
          stores.map((store) => {
            const statusColor =
              store.auth_status === "active"
                ? "text-green-600"
                : store.auth_status === "expired"
                  ? "text-orange-600"
                  : "text-red-600";

            return (
              <Card key={store.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{store.name}</CardTitle>
                      <CardDescription className="truncate">
                        ID: {store.id}
                      </CardDescription>
                    </div>
                    {store.auth_status === "active" ? (
                      <Badge className="bg-green-600 mt-2 md:mt-0 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-orange-600 mt-2 md:mt-0 flex items-center gap-1"
                      >
                        <Key className="h-3 w-3" />
                        Missing Credentials
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
                  <span
                    className={cn(
                      "capitalize font-semibold truncate",
                      statusColor,
                    )}
                  >
                    {store.auth_status ?? "unknown"}
                  </span>

                  <Button
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => {
                      if (store.platform === "amazon") {
                        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/amazon?storeId=${store.id}`;
                      } else if (store.platform === "faire") {
                        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/faire?storeId=${store.id}`;
                      } else {
                        handleManageCredentials(store);
                      }
                    }}
                  >
                    {["amazon", "faire", "shopify"].includes(store.platform)
                      ? store.auth_status === "active"
                        ? `Reconnect ${store.platform}`
                        : `Connect ${store.platform}`
                      : store.auth_status === "active"
                        ? "Edit Credentials"
                        : "Add Credentials"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {selectedStore && (
        <CredentialDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isEdit={selectedStore.auth_status === "active"}
          storeId={selectedStore.id}
          platform={platform}
          existingCredentials={selectedStore.store_credentials}
        />
      )}
    </div>
  );
}
