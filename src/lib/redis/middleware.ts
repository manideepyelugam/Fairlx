/**
 * Redis-powered Hono Middleware
 * 
 * Rate limiting middleware for API routes.
 * Uses sliding window counter stored in Redis.
 * 
 * GRACEFUL DEGRADATION: If Redis is unavailable, requests pass through.
 */

import type { Context, Next } from "hono";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";

/**
 * Rate limiting middleware factory for Hono routes
 * 
 * @param config - Rate limit configuration (from RATE_LIMITS or custom)
 * @param identifierFn - Function to extract the identifier (default: userId from session)
 * 
 * Usage:
 * ```ts
 * import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/redis";
 * 
 * app.post("/endpoint", rateLimitMiddleware(RATE_LIMITS.DEFAULT), handler);
 * ```
 */
export function rateLimitMiddleware(
    config: { maxRequests: number; windowSeconds: number } = RATE_LIMITS.DEFAULT,
    identifierFn?: (c: Context) => string
) {
    return async (c: Context, next: Next) => {
        try {
            // Extract identifier: prefer userId, fallback to IP
            let identifier: string;
            if (identifierFn) {
                identifier = identifierFn(c);
            } else {
                // Try to get user from session middleware context
                const user = c.get("user") as { $id?: string } | undefined;
                identifier = user?.$id || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "anonymous";
            }

            const endpoint = new URL(c.req.url).pathname;
            const result = await checkRateLimit(
                `${identifier}:${endpoint}`,
                config.maxRequests,
                config.windowSeconds
            );

            // Set rate limit headers
            c.header("X-RateLimit-Limit", String(config.maxRequests));
            c.header("X-RateLimit-Remaining", String(result.remaining));
            if (result.retryAfterMs) {
                c.header("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
            }

            if (!result.allowed) {
                return c.json(
                    { error: "Too many requests. Please try again later." },
                    429
                );
            }
        } catch {
            // Redis failure → fail open (allow request)
        }

        await next();
    };
}
