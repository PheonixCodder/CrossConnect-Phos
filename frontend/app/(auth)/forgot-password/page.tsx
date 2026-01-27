import { createClient } from "@/lib/supabase/server";
import { ForgotPasswordView } from "@/modules/auth/ui/views/forgot-password-view";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }
  return <ForgotPasswordView />;
};

export default page;
