import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/modules/dashboard/ui/views/DashboardView";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // You can also fetch your real metrics here and pass them down
  // to replace the mock data.
  const userDisplayName = user.user_metadata?.full_name || user.email;

  return <DashboardView userDisplayName={userDisplayName} />;
}
