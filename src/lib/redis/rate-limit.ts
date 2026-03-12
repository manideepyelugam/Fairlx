import "server-only";
import { getRedisClient } from "./client";

/**
 * Sliding Window Rate Limiter using Redis INCR + EXPIRE.
 * 
 * BEHAVIOR:
 * - Tracks request count per identifier per time window
 * - Returns whether request is allowed + remaining quota
 * - Fails OPEN (allows request) if Redis is down
 * 
 * USAGE:
 * - Apply to write-heavy endpoints (task create, comment create, file upload)
 * - Default: 100 requests/minute per user per endpoint
 * - Stricter: 10/min for login, 20/min for org create
 */
export async function checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
    const redis = getRedisClient();
    if (!redis) return { allowed: true, remaining: maxRequests }; // No Redis → allow all
    const key = `rate:${identifier}`;

    try {
        const multi = redis.multi();
        multi.incr(key);
        multi.pttl(key); // Get remaining TTL in ms
        const results = await multi.exec();

        if (!results) return { allowed: true, remaining: maxRequests };

        const count = (results[0]?.[1] as number) ?? 0;
        const pttl = (results[1]?.[1] as number) ?? -1;

        // Set expiry on first request in window
        if (pttl === -1 || pttl === -2) {
            await redis.expire(key, windowSeconds);
        }

        const allowed = count <= maxRequests;
        const remaining = Math.max(0, maxRequests - count);
        const retryAfterMs = allowed ? undefined : Math.max(0, pttl);

        return { allowed, remaining, retryAfterMs };
    } catch {
        return { allowed: true, remaining: maxRequests }; // Fail open
    }
}

/**
 * Rate limit middleware configuration
 */
export const RATE_LIMITS = {
    /** Default: 100 requests/min per user per endpoint */
    DEFAULT: { maxRequests: 100, windowSeconds: 60 },
    /** Login: 10 attempts/min */
    LOGIN: { maxRequests: 10, windowSeconds: 60 },
    /** Registration: 5 attempts/min */
    REGISTER: { maxRequests: 5, windowSeconds: 60 },
    /** Org create: 5/min */
    ORG_CREATE: { maxRequests: 5, windowSeconds: 60 },
    /** File upload: 30/min */
    FILE_UPLOAD: { maxRequests: 30, windowSeconds: 60 },
    /** Write operations: 60/min */
    WRITE: { maxRequests: 60, windowSeconds: 60 },
    /** BYOB registration: 5/hour per IP (anti-slug-squatting) */
    BYOB_REGISTER: { maxRequests: 5, windowSeconds: 3600 },
    /** BYOB resolve: 20/min per IP (anti-enumeration) */
    BYOB_RESOLVE: { maxRequests: 20, windowSeconds: 60 },
} as const;
