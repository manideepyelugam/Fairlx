"use client";

import { useEffect, useRef } from "react";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Terminal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { useDbInitStream } from "../api/use-db-init-stream";

interface DbInitProgressProps {
    orgSlug: string;
    envVars: Record<string, string>;
    onComplete?: () => void;
}

export const DbInitProgress = ({
    orgSlug,
    envVars,
    onComplete,
}: DbInitProgressProps) => {
    const {
        start,
        logs,
        isRunning,
        isComplete,
        result,
        error,
        percentage,
        currentPhase,
        etaSeconds,
    } = useDbInitStream();
    const hasStarted = useRef(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasStarted.current) {
            hasStarted.current = true;
            start(orgSlug, envVars);
        }
    }, [orgSlug, envVars, start]);

    // Auto-scroll logs
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const formatEta = (seconds: number | null): string => {
        if (seconds === null || seconds <= 0) return "";
        if (seconds < 60) return `~${seconds}s remaining`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `~${mins}m ${secs}s remaining`;
    };

    const successCount = result
        ? result.collectionsSucceeded.length +
        result.bucketsSucceeded.length
        : 0;
    const failCount = result
        ? result.collectionsFailed.length +
        result.bucketsFailed.length
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Database Initialization
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Setting up collections and storage buckets on your Appwrite instance...
                </p>
            </div>

            {/* Progress bar section */}
            <div className="space-y-3">
                {/* Percentage + Phase */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isRunning && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {isComplete && !error && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {error && <XCircle className="h-4 w-4 text-destructive" />}
                        <span className="text-sm font-medium">
                            {isComplete
                                ? error
                                    ? "Failed"
                                    : "Complete!"
                                : currentPhase}
                        </span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                        {percentage}%
                    </span>
                </div>

                {/* Animated progress bar */}
                <Progress
                    value={percentage}
                    className="h-3 transition-all duration-500"
                />

                {/* ETA */}
                {isRunning && etaSeconds !== null && etaSeconds > 0 && (
                    <p className="text-xs text-muted-foreground text-right">
                        {formatEta(etaSeconds)}
                    </p>
                )}
            </div>

            {/* Summary (on completion) */}
            {isComplete && result && (
                <div
                    className={`rounded-lg p-4 border ${result.success
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-yellow-500/10 border-yellow-500/20"
                        }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        {result.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className="font-semibold text-sm">
                            {result.success
                                ? "Your backend is ready!"
                                : "Completed with some issues"}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                            ✅ <strong>{successCount}</strong> resources created
                        </div>
                        {failCount > 0 && (
                            <div>
                                ❌ <strong>{failCount}</strong> failed
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg p-4 border bg-destructive/10 border-destructive/20">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                        <span className="font-semibold text-sm">
                            Initialization failed
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
            )}

            {/* Live Log */}
            <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Terminal className="h-3.5 w-3.5" />
                    Live Log ({logs.length} entries)
                </div>
                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 max-h-60 overflow-y-auto font-mono text-xs text-green-400">
                    {logs.length === 0 && (
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Waiting for events...
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="leading-relaxed">
                            <span className="text-zinc-600 select-none">
                                [{String(i + 1).padStart(3, "0")}]
                            </span>{" "}
                            {log}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* Done button */}
            {isComplete && result?.success && onComplete && (
                <Button onClick={onComplete} className="w-full" size="lg">
                    Continue to Sign In →
                </Button>
            )}

            {/* Retry button on failure */}
            {isComplete && !result?.success && (
                <Button
                    onClick={() => {
                        hasStarted.current = false;
                        start(orgSlug, envVars);
                    }}
                    variant="outline"
                    className="w-full"
                    size="lg"
                >
                    Retry Initialization
                </Button>
            )}
        </div>
    );
};
