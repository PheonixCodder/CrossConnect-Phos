"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Store,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { StoreRow } from "../../hooks/use-settings-data";
import { Database } from "@/types/supabase.types";
import { Separator } from "@/components/ui/separator";

type PlatformType = NonNullable<StoreRow["platform"]>;

const PLATFORM_NAMES: Record<PlatformType, string> = {
  shopify: "Shopify",
  faire: "Faire",
  amazon: "Amazon",
  walmart: "Walmart",
  tiktok: "TikTok",
  warehance: "Warehance",
  target: "Target",
};

interface StoresListProps {
  stores: StoreRow[] | null;
}

export function StoresList({ stores }: StoresListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Integrations</CardTitle>
        <CardDescription>
          Manage your connected sales channels and platforms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stores === null && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
            No stores connected yet.
          </div>
        )}

        {stores &&
          stores.map((store) => (
            <div
              key={store.id}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary border">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{store.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="capitalize">
                      {PLATFORM_NAMES[store.platform]}
                    </span>
                    {store.shopDomain && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          {store.shopDomain}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium">Status</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    {store.auth_status === "active" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-700">
                          Connected
                        </span>
                      </>
                    ) : store.auth_status === "expired" ? (
                      <>
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-700">Expired</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-orange-700 capitalize">
                          {store.auth_status}
                        </span>
                      </>
                    )}
                  </div>
                  {store.last_health_check && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Last sync:{" "}
                      {new Date(store.last_health_check).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <Separator orientation="vertical" className="h-10" />

                <div className="flex flex-col gap-1 min-w-[100px]">
                  <Badge
                    variant={
                      store.auth_status === "active" ? "default" : "secondary"
                    }
                    className="w-fit justify-self-end"
                  >
                    {store.platform}
                  </Badge>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
