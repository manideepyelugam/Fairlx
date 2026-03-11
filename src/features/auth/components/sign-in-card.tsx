"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { loginSchema } from "../schemas";
import { useLogin } from "../api/use-login";
import { TwoFactorChallengeCard } from "@/features/twoFactorAuth/components/two-factor-challenge-card";
import { TwoFactorMethod } from "@/features/twoFactorAuth/server/types";
import { useBYOBTenant } from "@/features/byob/api/use-byob-tenant";

interface SignInCardProps {
  returnUrl?: string;
  /**
   * When provided, the card is rendered in BYOB context.
   * - "Sign Up" link points to /{byobOrgSlug}/sign-up
   * - OAuth buttons are hidden (BYOB uses email/password only)
   * - "Sign in with your organisation" section is hidden
   */
  byobOrgSlug?: string;
}

export const SignInCard = ({ returnUrl, byobOrgSlug }: SignInCardProps) => {
  const [twoFactorData, setTwoFactorData] = useState<{
    tempToken: string;
    method: TwoFactorMethod;
    methods: TwoFactorMethod[];
    email: string;
  } | null>(null);

  const { mutate, isPending } = useLogin(returnUrl);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    mutate({ json: values }, {
      onSuccess: (data) => {
        if ("state" in data && data.state === "REQUIRE_2FA") {
          setTwoFactorData({
            tempToken: data.tempToken as string,
            method: data.method as TwoFactorMethod,
            methods: data.methods as TwoFactorMethod[],
            email: values.email,
          });
        }
      },
    });
  };

  if (twoFactorData) {
    return (
      <TwoFactorChallengeCard
        tempToken={twoFactorData.tempToken}
        method={twoFactorData.method}
        methods={twoFactorData.methods}
        email={twoFactorData.email}
        onCancel={() => setTwoFactorData(null)}
      />
    );
  }

  // Sign-up footer
  const signUpHref = byobOrgSlug
    ? `/${byobOrgSlug}/sign-up`
    : returnUrl
      ? `/sign-up?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/sign-up";

  return (
    <Card className="size-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">Welcome back!</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
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
                    <PasswordInput placeholder="Enter password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isPending} size="lg" className="w-full">
              Login
            </Button>
          </form>
        </Form>
        <div className="mt-4">
          <Link href="/forgot-password">
            <span className="text-sm text-blue-700 hover:underline">
              Forgot your password?
            </span>
          </Link>
        </div>
      </CardContent>

      {/* OAuth buttons — hidden in BYOB context */}
      {!byobOrgSlug && (
        <>
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
              Login with Google
            </Button>
            <Button
              onClick={() => signUpWithGithub(returnUrl)}
              disabled={isPending}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <FaGithub className="mr-2 size-5" />
              Login with GitHub
            </Button>
          </CardContent>
        </>
      )}

      {/* "Sign in with your organisation" — hidden in BYOB context (already there) */}
      {!byobOrgSlug && (
        <>
          <div className="px-7">
            <DottedSeparator />
          </div>
          <CardContent className="p-7">
            <OrgSignInSection />
          </CardContent>
        </>
      )}

      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex items-center justify-center">
        <p>
          Don&apos;t have an account?{" "}
          <Link href={signUpHref}>
            <span className="text-blue-700">Sign Up</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * Inline sub-component for "Sign in with your organisation" functionality.
 * Only shown on the Cloud sign-in page, not on BYOB /{orgSlug}/sign-in.
 */
const OrgSignInSection = () => {
  const router = useRouter();
  const [orgSlug, setOrgSlug] = useState("");
  const [showInput, setShowInput] = useState(false);

  const { data: existingTenant, isLoading: isChecking } = useBYOBTenant(orgSlug);
  const orgFound =
    existingTenant && "success" in existingTenant && existingTenant.success;
  const orgNotFound = !isChecking && orgSlug.length >= 3 && !orgFound;

  if (!showInput) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => setShowInput(true)}
      >
        <Building2 className="mr-2 size-4" />
        Sign in with your organisation
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Enter your organisation slug:
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
              if (e.key === "Enter" && orgFound) {
                router.push(`/${orgSlug}/sign-in`);
              }
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isChecking && orgSlug.length >= 3 && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {orgFound && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {orgNotFound && <XCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        <Button
          disabled={!orgFound}
          onClick={() => router.push(`/${orgSlug}/sign-in`)}
        >
          Go
        </Button>
      </div>

      {orgFound && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Organisation <span className="font-mono">{orgSlug}</span> found!
        </p>
      )}

      {orgNotFound && (
        <div className="space-y-1">
          <p className="text-xs text-destructive">Organisation not found</p>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => router.push(`/setup/${orgSlug}`)}
          >
            Want to set up this organisation? →
          </button>
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
