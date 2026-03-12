"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signUpWithGithub, signUpWithGoogle } from "@/lib/oauth";

import { registerSchema } from "../schemas";
import { useRegister } from "../api/use-register";
import { LegalAcceptance } from "./legal-acceptance";
import { useBYOBTenant } from "@/features/byob/api/use-byob-tenant";
import { generateSlugSuggestions } from "@/features/byob/utils/slug-suggestions";


interface SignUpCardProps {
  returnUrl?: string;
}

/**
 * SignUpCard - Simplified registration form
 * 
 * WHY simplified: Account type selection now happens POST-AUTH in onboarding.
 * This allows:
 * - Same flow for email/password and OAuth users
 * - Same email always resolves to same user
 * - No account type decision at signup time
 */
export const SignUpCard = ({ returnUrl }: SignUpCardProps) => {
  const { mutate, isPending } = useRegister(returnUrl);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      acceptedTerms: false as unknown as true,
      acceptedDPA: false as unknown as true,
    },
  });

  const acceptedTerms = form.watch("acceptedTerms");
  const acceptedDPA = form.watch("acceptedDPA");
  const isValid = acceptedTerms && acceptedDPA;

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    mutate({ json: values });
  };

  return (
    <Card className="size-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Join Fairlx today to start managing your projects with ease.
        </CardDescription>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LegalAcceptance
              acceptedTerms={acceptedTerms}
              acceptedDPA={acceptedDPA}
              onAcceptedTermsChange={(checked) => form.setValue("acceptedTerms", checked as true, { shouldValidate: true })}
              onAcceptedDPAChange={(checked) => form.setValue("acceptedDPA", checked as true, { shouldValidate: true })}
              disabled={isPending}
            />

            <Button type="submit" disabled={isPending || !isValid} size="lg" className="w-full">
              Sign Up
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex flex-col gap-y-4">
        <Button
          onClick={() => signUpWithGoogle(returnUrl)}
          disabled={isPending}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          <FcGoogle className="mr-2 size-5" />
          Sign Up with Google
        </Button>
        <Button
          onClick={() => signUpWithGithub(returnUrl)}
          disabled={isPending}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          <FaGithub className="mr-2 size-5" />
          Sign Up with GitHub
        </Button>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <BYOBSetupSection />
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex items-center justify-center">
        <p>
          Already have an account?{" "}
          <Link href={returnUrl ? `/sign-in?returnUrl=${encodeURIComponent(returnUrl)}` : "/sign-in"}>
            <span className="text-blue-700">Login</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * Inline sub-component for "Bring Your Own Backend" setup option
 * with live slug availability checking and suggestions.
 */
const BYOBSetupSection = () => {
  const router = useRouter();
  const [orgSlug, setOrgSlug] = useState("");
  const [showInput, setShowInput] = useState(false);

  const { data: existingTenant, isLoading: isChecking } = useBYOBTenant(orgSlug);
  const slugTaken = existingTenant && "success" in existingTenant && existingTenant.success;
  const isAvailable = !isChecking && orgSlug.length >= 3 && !slugTaken;

  const suggestions = useMemo(() => {
    if (!slugTaken || orgSlug.length < 3) return [];
    return generateSlugSuggestions(orgSlug, 5);
  }, [slugTaken, orgSlug]);

  if (!showInput) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => setShowInput(true)}
      >
        <Building2 className="mr-2 size-4" />
        Bring Your Own Backend
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose your organisation slug to get started:
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="my-company"
            value={orgSlug}
            onChange={(e) =>
              setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && isAvailable) {
                router.push(`/setup/${orgSlug}`);
              }
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isChecking && orgSlug.length >= 3 && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {!isChecking && orgSlug.length >= 3 && slugTaken && (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            {isAvailable && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        <Button
          disabled={!isAvailable}
          onClick={() => router.push(`/setup/${orgSlug}`)}
        >
          Go
        </Button>
      </div>

      {/* Available */}
      {isAvailable && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span className="font-mono">{orgSlug}</span> is available!
        </p>
      )}

      {/* Taken + suggestions */}
      {slugTaken && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">This slug is already taken</p>
          {suggestions.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-2.5 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Try one of these:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setOrgSlug(s)}
                    className="text-xs px-2 py-0.5 rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="text-xs text-muted-foreground hover:underline"
        onClick={() => setShowInput(false)}
      >
        Cancel
      </button>
    </div>
  );
};

