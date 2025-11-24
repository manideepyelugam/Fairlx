"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VerifyEmailSentContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const handleResendVerification = () => {
    if (!email) {
      router.push("/verify-email-needed");
      return;
    }
    
    // Redirect to verify-email-needed page with the email pre-filled
    router.push(`/verify-email-needed?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Check Your Email
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to {email ? (
              <span className="font-medium">{email}</span>
            ) : (
              "your email address"
            )}. Please click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Didn&apos;t receive the email? Check your spam folder or request a new one.</p>
          </div>
          
          {email && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendVerification}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Verification Email
            </Button>
          )}
          
          <Button asChild variant="ghost" className="w-full">
            <Link href="/sign-in">
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const VerifyEmailSentPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Check Your Email
            </CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailSentContent />
    </Suspense>
  );
};

export default VerifyEmailSentPage;