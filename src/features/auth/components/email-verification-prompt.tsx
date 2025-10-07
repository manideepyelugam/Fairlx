"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailVerificationPromptProps {
  email?: string;
  onClose?: () => void;
}

export const EmailVerificationPrompt = ({ email, onClose }: EmailVerificationPromptProps) => {
  const router = useRouter();

  const handleResendVerification = () => {
    if (!email) {
      router.push("/verify-email-needed");
      return;
    }
    
    // Navigate to verify-email-needed page with email pre-filled
    router.push(`/verify-email-needed?email=${encodeURIComponent(email)}`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Verification Required
        </CardTitle>
        <CardDescription>
          Please verify your email address to continue. We&apos;ve sent a verification link to{" "}
          {email && <span className="font-medium">{email}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Check your inbox and click the verification link. Don&apos;t forget to check your spam folder!</p>
        </div>
        
        {email && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
          >
            Resend Verification Email
          </Button>
        )}
        
        {onClose && (
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};