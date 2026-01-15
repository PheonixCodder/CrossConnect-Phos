import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { formSchema, FormValues } from "../schema/signUp.schema";
import { createClient } from "@/lib/supabase/client";

export const useSignUp = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (form: FormValues) => {
    setError(null);
    setIsLoading(true);

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_BASE_URL,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/");
      setIsLoading(false);
    }
  };

  return {
    form,
    error,
    isLoading,
    setError,
    setIsLoading,
    handleSubmit,
  };
};
