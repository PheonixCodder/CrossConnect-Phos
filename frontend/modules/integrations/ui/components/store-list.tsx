"use client";
import { Input } from "@/components/ui/input";
import { useRenameStore } from "../../hooks/use-rename-store";
import {
    ChevronLeft,
    Loader2,
    Key,
    ShieldCheck,
    AlertCircle,
    Plus,
    Pencil, Check, X
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import type {StoreWithCredentials} from "../../hooks/use-integrations-data";
import {CredentialDialog} from "./credential-dialog";
import {useState} from "react";
import type {Database} from "@/types/supabase.types";
import {cn} from "@/lib/utils";
import {AddStoreDialog} from "./add-store-dialog";
import {createClient} from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { useDeleteStore } from "../../hooks/use-delete-store";
import {ResponsiveDialog} from "@/components/layout/responsive-dialog";
import {toast} from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {ListStore, TikTokShopsState} from "@/types/types";

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
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
    const [storeName, setStoreName] = useState("");
    const renameStore = useRenameStore();
    const deleteStore = useDeleteStore();
    const [storeToDelete, setStoreToDelete] =
        useState<StoreWithCredentials | null>(null);
    const queryClient = useQueryClient();



    const handleManageCredentials = (store: StoreWithCredentials) => {
        setSelectedStore(store);
        setDialogOpen(true);
    };

    const startRename = (store: StoreWithCredentials) => {
        setEditingStoreId(store.id);
        setStoreName(store.name);
    };

    const cancelRename = () => {
        setEditingStoreId(null);
        setStoreName("");
    };

    const submitRename = async (storeId: string) => {
        try {
            await renameStore.mutateAsync({
                storeId,
                name: storeName,
            });
            toast.success('Store renamed Successfully');
        } catch (error) {
            console.error(error);
            toast.error(`Failed to rename: ${error}`);
        } finally {
            cancelRename();
        }
    };



    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-2 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronLeft className="h-5 w-5"/>
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
                        <Plus className="h-4 w-4 mr-2"/>
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
                            <AlertCircle className="h-6 w-6 text-muted-foreground mb-4"/>
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
                            <Card key={store.id} className="flex flex-col">
                                {/* HEADER */}
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        {/* Left: Name + ID */}
                                        <div className="min-w-0 space-y-1">
                                            <CardTitle className="flex items-center gap-2 truncate">
                                                {editingStoreId === store.id ? (
                                                    <div className="flex items-center gap-2 w-full">
                                                        <Input
                                                            value={storeName}
                                                            onChange={(e) => setStoreName(e.target.value)}
                                                            className="h-8"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => submitRename(store.id)}
                                                            disabled={renameStore.isPending}
                                                        >
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={cancelRename}>
                                                            <X className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="truncate">{store.name}</span>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => startRename(store)}
                                                        >
                                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </>
                                                )}
                                            </CardTitle>

                                            <CardDescription className="truncate">
                                                ID: {store.id}
                                            </CardDescription>
                                        </div>

                                        {/* Right: Status badge + delete */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {store.auth_status === "active" ? (
                                                <Badge className="bg-green-600 flex items-center gap-1">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Configured
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="text-orange-600 flex items-center gap-1"
                                                >
                                                    <Key className="h-3 w-3" />
                                                    Missing Credentials
                                                </Badge>
                                            )}

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setStoreToDelete(store)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* BODY */}
                                <CardContent className="pt-0">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <span
          className={cn(
              "capitalize font-semibold truncate",
              statusColor,
          )}
      >
        {store.auth_status ?? "unknown"}
      </span>

                                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                            <Button
                                                size="sm"
                                                className="whitespace-nowrap"
                                                onClick={() => {
                                                    if (store.platform === "faire") {
                                                        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/faire?storeId=${store.id}`;
                                                    } else if (store.platform === "tiktok") {
                                                        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/tiktok?storeId=${store.id}`;
                                                    } else {
                                                        handleManageCredentials(store);
                                                    }
                                                }}
                                            >
                                                {["faire", "shopify", "tiktok"].includes(store.platform)
                                                    ? store.auth_status === "active"
                                                        ? `Reconnect ${store.platform}`
                                                        : `Connect ${store.platform}`
                                                    : store.auth_status === "active"
                                                        ? "Edit Credentials"
                                                        : "Add Credentials"}
                                            </Button>

                                            {platform === "warehance" &&
                                                store.auth_status === "inactive" &&
                                                store.stores && (
                                                    <Combobox
                                                        items={(store.stores as ListStore[]).map((s) => s.name)}
                                                    >
                                                        <ComboboxInput placeholder="Select a Warehance Store"/>
                                                        <ComboboxContent>
                                                            <ComboboxEmpty>No stores found</ComboboxEmpty>
                                                            <ComboboxList>
                                                                {(item) => (
                                                                    <ComboboxItem
                                                                        key={item}
                                                                        value={item}
                                                                        onClick={async () => {
                                                                            const selectedStore = (
                                                                                store.stores as ListStore[]
                                                                            ).find((s: ListStore) => s.name === item);
                                                                            const supabase = createClient();
                                                                            await supabase
                                                                                .from("store_credentials")
                                                                                .upsert({
                                                                                    store_id: store.id,
                                                                                    credentials: {
                                                                                        TIKTOK_STORE_ID: selectedStore!.id,
                                                                                        ...(store.store_credentials![0]
                                                                                            .credentials as object),
                                                                                    },
                                                                                });
                                                                            await supabase
                                                                                .from("stores")
                                                                                .update({
                                                                                    auth_status: "active",
                                                                                })
                                                                                .eq("id", store.id);
                                                                            await queryClient.invalidateQueries({
                                                                                queryKey: ["stores"],
                                                                            });
                                                                        }}
                                                                    >
                                                                        {item}
                                                                    </ComboboxItem>
                                                                )}
                                                            </ComboboxList>
                                                        </ComboboxContent>
                                                    </Combobox>
                                                )}
                                            {platform === "tiktok" &&
                                                store.auth_status === "inactive" &&
                                                store.stores && (
                                                    <Combobox
                                                        // Casting once at the top for cleaner code
                                                        items={(((store.stores as unknown) as TikTokShopsState)?.shops ?? []).map((s) => s.name)}
                                                    >
                                                        <ComboboxInput placeholder="Select a Tiktok Store" />
                                                        <ComboboxContent>
                                                            <ComboboxEmpty>No stores found</ComboboxEmpty>
                                                            <ComboboxList>
                                                                {(item) => (
                                                                    <ComboboxItem
                                                                        key={item}
                                                                        value={item}
                                                                        onClick={async () => {
                                                                            const shops = ((store.stores as unknown) as TikTokShopsState).shops;
                                                                            const selectedStore = shops.find((s) => s.name === item);

                                                                            if (!selectedStore) return;

                                                                            const supabase = createClient();
                                                                            const storedCreds = store.store_credentials![0].credentials as Record<string, string>;


                                                                            // 1. Update credentials with BOTH ID and the mandatory Shop Cipher
                                                                            await supabase
                                                                                .from("store_credentials")
                                                                                .upsert({
                                                                                    store_id: store.id,
                                                                                    credentials: {
                                                                                        shop_cipher: selectedStore.cipher,
                                                                                        ...storedCreds
                                                                                    },
                                                                                }, { onConflict: 'store_id' },
                                                                                );

                                                                            // 2. Mark the store as active
                                                                            await supabase
                                                                                .from("stores")
                                                                                .update({
                                                                                    auth_status: "active",
                                                                                })
                                                                                .eq("id", store.id);

                                                                            // 3. Refresh the UI
                                                                            await queryClient.invalidateQueries({
                                                                                queryKey: ["stores"],
                                                                            });
                                                                        }}
                                                                    >
                                                                        {item}
                                                                    </ComboboxItem>
                                                                )}
                                                            </ComboboxList>
                                                        </ComboboxContent>
                                                    </Combobox>
                                                )}                                        </div>
                                    </div>
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
                    existingCredentials={selectedStore?.store_credentials?.[0] ?? null}
                />
            )}
            {storeToDelete && (
                <ResponsiveDialog
                    open={!!storeToDelete}
                    onOpenChange={(open) => !open && setStoreToDelete(null)}
                    title="Delete store"
                    description={`This will permanently delete "${storeToDelete.name}" and all related data.`}
                >
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setStoreToDelete(null)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            disabled={deleteStore.isPending}
                            onClick={async () => {
                                try {
                                    await deleteStore.mutateAsync({
                                        storeId: storeToDelete.id,
                                    });
                                } catch (error) {
                                    console.error(error);
                                    toast.error(('Failed to delete store'));
                                } finally {
                                    setStoreToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </ResponsiveDialog>
            )}
        </div>
    );
}
