// modules/auth/hooks/use-sign-in.ts
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { formSchema, FormValues } from "../schema/signIn.schema";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export const useSignIn = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const handleSubmit = useCallback(
    async (values: FormValues) => {
      setError(null);
      setIsLoading(true);

      try {
        const supabase = createClient();

        const { error: signInError, data } =
          await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          });

        if (signInError) {
          throw new Error(signInError.message);
        }

        if (data?.user) {
          toast.success("Welcome back!", {
            description: "Successfully signed in to your account.",
          });

          // Redirect to dashboard or intended page
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        toast.error("Sign in failed", {
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const resetForm = useCallback(() => {
    form.reset();
    setError(null);
  }, [form]);

  return {
    form,
    error,
    setError,
    isLoading,
    setIsLoading,
    handleSubmit,
    resetForm,
  };
};
