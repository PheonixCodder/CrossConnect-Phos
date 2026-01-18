"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  onboardingSchema,
  OnboardingFormValues,
} from "../schema/onboarding.schema";

export const useOnboardingView = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: "",
    },
  });

  const handleSubmit = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        router.push("/signin");
        return;
      }

      // The trigger in the DB will now handle adding the user to organization_members
      // This means .select() will succeed because the user is a member by the time it runs
      const { error: orgError } = await supabase.from("organizations").insert({
        name: values.organizationName,
        created_by: user.id,
      });

      if (orgError) {
        console.error("Error creating organization:", orgError.message);
        setIsLoading(false);
        setIsError(orgError.message);
        return;
      }

      // No manual insert to organization_members needed here anymore!

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    handleSubmit,
    setIsError,
    isError,
  };
};
