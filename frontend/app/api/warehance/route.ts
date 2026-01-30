import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ListStore } from "@/modules/integrations/ui/components/store-list";
import { Json } from "@/types/supabase.types";

export async function POST(request: Request) {
  try {
    const { apiKey, storeId } = await request.json();
    const supabase = await createClient();

    const allStores: ListStore[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      // 1. Fetch the raw response first
      const res = await fetch(
        `https://api.warehance.com/v1/stores?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            "X-API-KEY": apiKey,
          },
        },
      );

      // 2. Check for HTTP errors (like 400 or 401)
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Warehance Error:", errorData);
        throw new Error(
          errorData?.errors?.[0]?.message || `API Error: ${res.status}`,
        );
      }

      // 3. Parse the data
      const json = await res.json();

      // Based on your working snippet, the stores are likely in json.data.stores
      const stores =
        json.data?.stores?.filter((s: ListStore) =>
          s.marketplace?.name?.toLowerCase().includes("tiktok"),
        ) || [];

      allStores.push(...stores);

      // 4. Update pagination logic based on actual Warehance response keys
      if (json.has_next_page) {
        offset += limit;
      } else {
        hasNext = false;
      }
    }

    const { error } = await supabase
      .from("stores")
      .update({ stores: allStores as Json[], auth_status: "inactive" })
      .eq("id", storeId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
