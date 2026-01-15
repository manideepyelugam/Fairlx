"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { useFirstLogin } from "@/features/auth/api/use-first-login";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FirstLoginContent = () => {
    const searchParams = useSearchParams();
    const firstLogin = useFirstLogin();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const hasAttempted = useRef(false);

    useEffect(() => {
        // Prevent multiple attempts
        if (hasAttempted.current) return;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            return;
        }

        hasAttempted.current = true;

        firstLogin.mutate(
            { json: { token } },
            {
                onSuccess: (data) => {
                    if ("success" in data && data.success) {
                        setStatus("success");
                    } else {
                        setStatus("error");
                    }
                },
                onError: () => {
                    setStatus("error");
                },
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Verifying Magic Link
                        </CardTitle>
                        <CardDescription>
                            Please wait while we log you in...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            Success!
                        </CardTitle>
                        <CardDescription>
                            Magic link verified. Redirecting you to set your password...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        Login Failed
                    </CardTitle>
                    <CardDescription>
                        The magic link is invalid, expired, or has already been used.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/sign-in">
                            Back to Login
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

const FirstLoginPage = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading...
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        }>
            <FirstLoginContent />
        </Suspense>
    );
};

export default FirstLoginPage;
