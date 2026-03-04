/**
 * Redis Cache Layer — Public Exports
 * 
 * Import from "@/lib/redis" for all cache operations.
 * 
 * ARCHITECTURE:
 * - client.ts: Redis singleton connection
 * - cache.ts: Cache-aside helpers (cached, invalidate, counters)
 * - keys.ts: Centralized key registry (CK, TTL, CKPattern, hashFilters)
 * - rate-limit.ts: Sliding window rate limiter
 * 
 * USAGE:
 * ```typescript
 * import { cached, invalidateCache, CK, TTL } from "@/lib/redis";
 * 
 * // Cache a function result
 * const member = await cached(
 *   CK.workspaceMember(userId, workspaceId),
 *   () => getMemberFromDB(databases, workspaceId, userId),
 *   TTL.WORKSPACE_MEMBER
 * );
 * 
 * // Invalidate on write
 * await invalidateCache(CK.workspaceMember(userId, workspaceId));
 * ```
 */

// Client
export { getRedisClient, getRedisSubscriber, isRedisHealthy, closeRedis } from "./client";

// Cache operations
export {
    cached,
    cachedCounter,
    incrementCounter,
    decrementCounter,
    invalidateCache,
    invalidateCachePattern,
    setIfNotExists,
    getCacheStats,
} from "./cache";

// Key registry
export { TTL, CK, CKPattern, hashFilters } from "./keys";

// Rate limiting
export { checkRateLimit, RATE_LIMITS } from "./rate-limit";

// Middleware
export { rateLimitMiddleware } from "./middleware";
