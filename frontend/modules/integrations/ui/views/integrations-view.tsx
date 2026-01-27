"use client";

import { useQueryState } from "nuqs";
import { PageContainer } from "@/components/layout/PageContainer";
import { PlatformCard } from "../components/platform-card";
import { StoreList } from "../components/store-list";
import { usePlatformOverview } from "../../hooks/use-platform-overview";
import { useIntegrationsData } from "../../hooks/use-integrations-data";
import type { Database } from "@/types/supabase.types";

type Platform = Database["public"]["Enums"]["platform_types"];

const PLATFORMS: Platform[] = [
  "shopify",
  "faire",
  "amazon",
  "walmart",
  "warehance",
  "target",
];

export function IntegrationsView() {
  const [platform, setPlatform] =
    useQueryState<Platform | null>("platform", {
      defaultValue: null,
      parse: (v) =>
        PLATFORMS.includes(v as Platform)
          ? (v as Platform)
          : null,
    });

  const { platforms, isLoading: overviewLoading } =
    usePlatformOverview();

  const { data: stores, isLoading: storesLoading } =
    useIntegrationsData(platform);

  // Show Store List if a platform is selected
  if (platform) {
    return (
      <PageContainer>
        <StoreList
          platform={platform}
          stores={stores ?? []}
          isLoading={storesLoading}
          onBack={() => setPlatform(null)}
        />
      </PageContainer>
    );
  }

  // Platform overview grid
  return (
    <PageContainer>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              loading={overviewLoading}
              onClick={() => setPlatform(p)}
            />
          );
        })}
      </div>
    </PageContainer>
  );
}
