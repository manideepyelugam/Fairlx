"use client";

import { RefreshCcw, Loader2 } from "lucide-react";
import { useAppReadiness } from "./app-readiness-provider";
import { Button } from "@/components/ui/button";

/**
 * Global App Loader
 * 
 * Full-screen overlay shown during cold start.
 * - Neutral copy: "Setting things up…" or "Loading your workspace…"
 * - If timeout: "This is taking longer than expected" with Retry
 */
export const GlobalAppLoader = () => {
    const { isAppReady, isTimedOut, loadingMessage, retry } = useAppReadiness();

    if (isAppReady) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            {/* Logo/Brand placeholder */}
            <div className="flex flex-col items-center gap-6">
                {/* Spinner */}
                {!isTimedOut && (
                    <div className="relative">
                        <span className="inline-flex h-12 w-12 rounded-full border-3 border-muted-foreground/20 border-t-primary animate-spin" />
                    </div>
                )}

                {/* Timeout state */}
                {isTimedOut && (
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCcw className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}

                {/* Message */}
                <div className="text-center">
                    <p className="text-lg font-medium text-foreground">
                        {isTimedOut ? "This may take a bit longer on first login or slow connections" : loadingMessage}
                    </p>
                    {isTimedOut && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Please wait a moment, or try again if the issue persists.
                        </p>
                    )}
                </div>

                {/* Retry button */}
                {isTimedOut && (
                    <Button onClick={retry} variant="outline" className="mt-2">
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                )}

                {/* Loading indicator for retry */}
                {!isTimedOut && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Please wait…</span>
                    </div>
                )}
            </div>
        </div>
    );
};
