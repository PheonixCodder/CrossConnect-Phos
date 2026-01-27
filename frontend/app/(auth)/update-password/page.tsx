import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordView } from "@/modules/auth/ui/views/update-password-view";
import { redirect } from "next/navigation";
import React from "react";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: { code: string };
}) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return redirect("/");
  }

  return <UpdatePasswordView code={searchParams.code} />;
}
