import "server-only";
import Redis from "ioredis";

/**
 * Redis Client Singleton
 * 
 * Creates a single Redis connection shared across all server-side code.
 * Gracefully handles connection failures — app NEVER breaks if Redis is down.
 * 
 * ARCHITECTURE:
 * - Single connection for cache reads/writes
 * - Separate subscriber connection for Pub/Sub (Socket.IO adapter)
 * - Lazy connect: doesn't block server startup
 * - Auto-reconnect with exponential backoff
 */

let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redis) {
        const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
        redis = new Redis(url, {
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 10) return null; // Stop retrying after 10 attempts
                return Math.min(times * 100, 3000); // Exponential backoff, max 3s
            },
            enableOfflineQueue: false, // Don't queue commands when disconnected
            lazyConnect: true,
            connectTimeout: 5000,
            commandTimeout: 3000, // Individual command timeout
        });

        redis.on("error", (err) => {
            console.error("[Redis] Connection error:", err.message);
        });

        redis.on("connect", () => {
            console.log("[Redis] Connected successfully");
        });

        redis.on("close", () => {
            console.warn("[Redis] Connection closed");
        });

        redis.connect().catch((err) => {
            console.error("[Redis] Initial connect failed:", err.message);
        });
    }
    return redis;
}

/**
 * Get a duplicate client for Redis Pub/Sub (subscriber needs dedicated connection)
 * Used by Socket.IO Redis adapter
 */
export function getRedisSubscriber(): Redis {
    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    const sub = new Redis(url, {
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 10) return null;
            return Math.min(times * 100, 3000);
        },
        enableOfflineQueue: false,
        lazyConnect: true,
        connectTimeout: 5000,
    });

    sub.on("error", (err) => {
        console.error("[Redis:Sub] Connection error:", err.message);
    });

    sub.connect().catch((err) => {
        console.error("[Redis:Sub] Initial connect failed:", err.message);
    });

    return sub;
}

/**
 * Check if Redis is connected and responsive
 */
export async function isRedisHealthy(): Promise<boolean> {
    try {
        const client = getRedisClient();
        const result = await client.ping();
        return result === "PONG";
    } catch {
        return false;
    }
}

/**
 * Gracefully close Redis connections (for shutdown)
 */
export async function closeRedis(): Promise<void> {
    if (redis) {
        await redis.quit().catch(() => {});
        redis = null;
    }
}
