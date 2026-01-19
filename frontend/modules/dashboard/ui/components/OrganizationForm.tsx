"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { getCurrentUserId } from "@/lib/helpers/getUser";

// 1. Schema Definition
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type OrganizationFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const OrganizationForm = ({
  onSuccess,
  onCancel,
}: OrganizationFormProps) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  // 2. TanStack Mutation for Creating Organization
  const { mutate: createOrg, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const user = await getCurrentUserId()
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: values.name,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // 3. REFETCH ON CREATE: This is the magic line
      // It forces GlobalContextSwitcher to refetch from Supabase
      queryClient.invalidateQueries({ queryKey: ["organizations"] });

      toast.success("Organization created successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createOrg(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 'Acme Corp'"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-x-2 pt-4">
          {onCancel && (
            <Button
              variant="ghost"
              type="button"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Organization
          </Button>
        </div>
      </form>
    </Form>
  );
};
