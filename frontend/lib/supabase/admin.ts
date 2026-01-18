import { createClient } from "@supabase/supabase-js";

// This ensures the client is NEVER accidentally used on the client-side
import "server-only";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // Your sb_secret_... key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
