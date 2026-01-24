import type { Database } from "@/types/supabase.types";

export type PlatformTypes = Database["public"]["Enums"]["platform_types"];

// Mapping of platform to required credential fields
export const CREDENTIALS_CONFIG: Record<
  PlatformTypes,
  {
    label: string;
    fields: { key: string; label: string; type: "text" | "password" }[];
  }
> = {
  amazon: {
    label: "Amazon",
    fields: [],
  },
  faire: {
    label: "Faire",
    fields: [],
  },
  shopify: {
    label: "Shopify",
    fields: [
      {
        key: "SHOPDOMAIN",
        label: "Shop Domain (e.g. my-store.myshopify.com)",
        type: "text",
      },
    ],
  },
  target: {
    label: "Target",
    fields: [
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "sellerId", label: "Seller ID", type: "text" },
      { key: "sellerToken", label: "Seller Token", type: "password" },
    ],
  },
  walmart: {
    label: "Walmart",
    fields: [
      { key: "WALMART_CLIENT_ID", label: "Client ID", type: "text" },
      {
        key: "WALMART_CLIENT_SECRET",
        label: "Client Secret",
        type: "password",
      },
    ],
  },
  tiktok: {
    label: "TikTok",
    fields: [
      { key: "APP_KEY", label: "App Key", type: "text" },
      { key: "APP_SECRET", label: "App Secret", type: "password" },
    ],
  },
  warehance: {
    label: "Warehance",
    fields: [{ key: "WAREHANCE_API_KEY", label: "API Key", type: "password" }],
  },
};

// Platform Assets
export const PLATFORM_ICONS: Record<PlatformTypes, string> = {
  amazon: "/images/amazon.svg",
  faire: "/images/faire.svg",
  shopify: "/images/shopify.svg",
  target: "/images/target.png",
  walmart: "/images/walmart.svg",
  warehance: "/images/warehance.svg",
  tiktok: "/images/tiktok.svg", // Added fallback for completeness
};
