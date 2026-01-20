import { createClient } from "../supabase/client";

// Helper to get current user ID if not using a custom hook
export const getCurrentUserId = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};
