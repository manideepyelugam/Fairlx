"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

/**
 * 403 Forbidden / Permission Denied Page
 * 
 * Displayed when a user attempts to access a route they don't have
 * permission to view.
 */
export default function ForbiddenPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted px-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <ShieldX className="h-16 w-16 text-destructive" />
                    </div>
                </div>

                {/* Title and message */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-foreground">
                        Access Denied
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        You don&apos;t have permission to view this page.
                    </p>
                    <p className="text-muted-foreground text-sm">
                        If you believe this is an error, please contact your organization administrator.
                    </p>
                </div>

                {/* Error code */}
                <div className="py-4 px-6 bg-muted rounded-lg inline-block">
                    <span className="font-mono text-muted-foreground text-sm">
                        Error Code: 403 Forbidden
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Home className="h-4 w-4" />
                        Go to Dashboard
                    </Link>
                    <button
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </button>
                </div>

                {/* Help text */}
                <p className="text-muted-foreground text-xs">
                    Need help?{" "}
                    <Link href="/profile" className="text-primary hover:underline">
                        View your profile
                    </Link>{" "}
                    or contact support.
                </p>
            </div>
        </div>
    );
}
