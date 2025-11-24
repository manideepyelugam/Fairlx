"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail, AlertCircle, ArrowLeft } from "lucide-react";

import { resendVerificationSchema } from "@/features/auth/schemas";
import { useResendVerification } from "@/features/auth/api/use-resend-verification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

import { DottedSeparator } from "@/components/dotted-separator";

type FormData = z.infer<typeof resendVerificationSchema>;

const VerifyEmailNeededContent = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [emailSent, setEmailSent] = useState(false);
  const resendVerification = useResendVerification();

  const form = useForm<FormData>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: email,
      password: "",
    },
  });

  const onSubmit = (values: FormData) => {
    resendVerification.mutate(
      { json: values },
      {
        onSuccess: (data) => {
          if ('success' in data && data.success) {
            setEmailSent(true);
          }
        },
      }
    );
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Verification Email Sent!
            </CardTitle>
            <CardDescription>
              We&apos;ve sent a new verification link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Check your inbox for the verification email</p>
              <p>• Don&apos;t forget to check your spam folder</p>
              <p>• Click the verification link to activate your account</p>
            </div>
            
            <Button asChild className="w-full">
              <Link href="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Email Verification Required
          </CardTitle>
          <CardDescription>
            Your account needs to be verified before you can log in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                We need to verify your email address before you can access your account. 
                Enter your password below to resend the verification email.
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        disabled={resendVerification.isPending}
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Enter your password"
                        disabled={resendVerification.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={resendVerification.isPending}
              >
                {resendVerification.isPending ? "Sending..." : "Send Verification Email"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4">
            <DottedSeparator />
          </div>
          
          <Button asChild variant="ghost" className="w-full">
            <Link href="/sign-in">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const VerifyEmailNeededPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Email Verification Required
            </CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailNeededContent />
    </Suspense>
  );
};

export default VerifyEmailNeededPage;