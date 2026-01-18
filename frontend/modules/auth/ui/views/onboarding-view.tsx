"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useOnboardingView } from "../../hooks/use-onboarding-view";

export const OnboardingView = () => {
  const { form, isLoading, handleSubmit, isError } = useOnboardingView();

  return (
    <div className="w-full max-w-md animate-fade-in">
      <Card className="overflow-hidden border-border/50 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">C</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create your organization
            </h1>
            <p className="text-muted-foreground mt-1">
              This will be your primary workspace
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Acme Inc."
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* If isError display isError message */}
              {isError && <p className="text-destructive text-sm">{isError}</p>}
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
