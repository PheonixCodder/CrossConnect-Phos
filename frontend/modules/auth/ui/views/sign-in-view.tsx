"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoAlert } from "react-icons/go";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSignIn } from "@/modules/auth/hooks/use-sign-in";
import { SocialsButtons } from "@/modules/auth/ui/components/social-buttons";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export const SignInView = () => {
  const { form, error, setError, isLoading, setIsLoading, handleSubmit } = useSignIn();

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
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1">
              Sign in to your CrossConnect account
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="you@example.com"
                        type="email"
                        disabled={isLoading}
                        autoComplete="email"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="••••••••"
                        type="password"
                        disabled={isLoading}
                        autoComplete="current-password"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <GoAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <SocialsButtons setIsLoading={setIsLoading} setError={setError} isLoading={isLoading} />

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/signup"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
};
