"use client";

import { useQueryState } from "nuqs";
import { PageContainer } from "@/components/layout/PageContainer";
import { PlatformCard } from "../components/platform-card";
import { StoreList } from "../components/store-list";
import { usePlatformOverview } from "../../hooks/use-platform-overview";
import { useIntegrationsData } from "../../hooks/use-integrations-data";
import type { Database } from "@/types/supabase.types";

type PlatformType = Database["public"]["Enums"]["platform_types"];

const PLATFORMS: PlatformType[] = [
  "shopify",
  "faire",
  "amazon",
  "walmart",
  "warehance",
  "target",
];

export function IntegrationsView() {
  const [platform, setPlatform] = useQueryState<PlatformType | null>(
    "platform",
    {
      defaultValue: null,
      parse: (value) =>
        PLATFORMS.includes(value as PlatformType)
          ? (value as PlatformType)
          : null,
    }
  );

  const { platforms, isLoading: isOverviewLoading } =
    usePlatformOverview();

  const { data: stores, isLoading: isStoresLoading } =
    useIntegrationsData(platform);

  if (platform) {
    return (
      <PageContainer>
        <StoreList
          platform={platform}
          stores={stores ?? []}
          isLoading={isStoresLoading}
          onBack={() => setPlatform(null)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Integrations
          </h2>
          <p className="text-muted-foreground">
            Connect and manage your sales channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORMS.map((p) => {
            const data =
              platforms.find((x) => x.platform === p) ?? {
                platform: p,
                totalStores: 0,
                activeStores: 0,
                lastSync: null,
                trend: 0,
                share: 0,
              };

            return (
              <PlatformCard
                key={p}
                data={data}
                loading={isOverviewLoading}
                onClick={() => setPlatform(p)}
              />
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
