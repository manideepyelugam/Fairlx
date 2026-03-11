import { useState, useCallback, useRef } from "react";

interface ProgressInfo {
    type: "progress" | "complete" | "error";
    message?: string;
    step?: number;
    total?: number;
    phase?: "buckets" | "collections";
    result?: {
        success: boolean;
        collectionsSucceeded: string[];
        collectionsFailed: string[];
        bucketsSucceeded: string[];
        bucketsFailed: string[];
    };
    error?: string;
}

interface UseDbInitStreamReturn {
    start: (orgSlug: string, envVars: Record<string, string>) => void;
    logs: string[];
    isRunning: boolean;
    isComplete: boolean;
    result: ProgressInfo["result"] | null;
    error: string | null;
    /** 0–100 percentage */
    percentage: number;
    /** Current phase label */
    currentPhase: string;
    /** Estimated seconds remaining (null if not calculable) */
    etaSeconds: number | null;
}

/**
 * SSE streaming hook for BYOB database initialization.
 * Now tracks structured progress with step/total for percentage & ETA.
 */
export const useDbInitStream = (): UseDbInitStreamReturn => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [result, setResult] = useState<ProgressInfo["result"] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [percentage, setPercentage] = useState(0);
    const [currentPhase, setCurrentPhase] = useState("Initializing...");
    const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

    // Track timing per phase for ETA
    const phaseStartRef = useRef<number>(0);
    const phaseStepsRef = useRef<number>(0);

    const start = useCallback(
        async (orgSlug: string, envVars: Record<string, string>) => {
            setLogs([]);
            setIsRunning(true);
            setIsComplete(false);
            setResult(null);
            setError(null);
            setPercentage(0);
            setCurrentPhase("Initializing...");
            setEtaSeconds(null);
            phaseStartRef.current = Date.now();
            phaseStepsRef.current = 0;

            // Track: 3 setup phases (encrypt, db, buckets header) = 5%
            // Buckets phase = 20%, Collections phase = 65%, Finalize = 10%
            let bucketTotal = 0;
            let collectionTotal = 0;
            let bucketsDone = 0;
            let collectionsDone = 0;

            const calcPercent = () => {
                // Base 5% for initial setup, 20% for buckets, 65% for collections, 10% finalize
                const bucketPct = bucketTotal > 0 ? (bucketsDone / bucketTotal) * 20 : 0;
                const collectionPct = collectionTotal > 0 ? (collectionsDone / collectionTotal) * 65 : 0;
                return Math.min(Math.round(5 + bucketPct + collectionPct), 95);
            };

            const calcEta = (done: number, total: number) => {
                if (done === 0 || total === 0) return null;
                const elapsed = (Date.now() - phaseStartRef.current) / 1000;
                const perItem = elapsed / done;
                const remaining = (total - done) * perItem;
                return Math.ceil(remaining);
            };

            try {
                const response = await fetch("/api/byob/initialize-db", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgSlug, envVars }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to start DB initialization");
                }

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response stream");

                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const msg = JSON.parse(line.slice(6)) as ProgressInfo;

                                if (msg.type === "progress" && msg.message) {
                                    setLogs((prev) => [...prev, msg.message!]);

                                    // Update phase tracking
                                    if (msg.phase === "buckets") {
                                        setCurrentPhase("Setting up storage buckets...");
                                        if (msg.total && msg.total > 0) {
                                            bucketTotal = msg.total;
                                            bucketsDone = msg.step || 0;
                                            phaseStartRef.current = phaseStartRef.current || Date.now();
                                            setPercentage(calcPercent());
                                            setEtaSeconds(calcEta(bucketsDone, bucketTotal + collectionTotal));
                                        }
                                    } else if (msg.phase === "collections") {
                                        setCurrentPhase("Setting up collections...");
                                        if (msg.total && msg.total > 0) {
                                            collectionTotal = msg.total;
                                            collectionsDone = msg.step || 0;
                                            if (phaseStepsRef.current === 0) {
                                                phaseStartRef.current = Date.now();
                                                phaseStepsRef.current = 1;
                                            }
                                            setPercentage(calcPercent());
                                            setEtaSeconds(calcEta(collectionsDone, collectionTotal));
                                        }
                                    } else {
                                        // General progress (encrypt, db creation)
                                        setPercentage((prev) => Math.min(prev + 2, 5));
                                        setCurrentPhase(msg.message);
                                    }
                                }

                                if (msg.type === "complete") {
                                    setResult(msg.result || null);
                                    setIsComplete(true);
                                    setPercentage(100);
                                    setCurrentPhase("Complete!");
                                    setEtaSeconds(0);
                                } else if (msg.type === "error") {
                                    setError(msg.error || "Unknown error");
                                    setIsComplete(true);
                                    setCurrentPhase("Error");
                                }
                            } catch {
                                // Skip malformed events
                            }
                        }
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
                setIsComplete(true);
                setCurrentPhase("Error");
            } finally {
                setIsRunning(false);
            }
        },
        []
    );

    return { start, logs, isRunning, isComplete, result, error, percentage, currentPhase, etaSeconds };
};
