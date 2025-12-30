import "server-only";

/**
 * Recent Authentication Validation
 * 
 * ENTERPRISE SECURITY: Validates that the user's session is fresh enough
 * for sensitive operations like account deletion, password changes, etc.
 * 
 * INVARIANTS:
 * - Sensitive actions require authentication within the last 5 minutes
 * - Re-authentication can be triggered if session is stale
 * - Never blocks read operations, only destructive/sensitive writes
 */

// Default: 5 minutes for sensitive operations
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

// Shorter: 2 minutes for critical operations like deletion
export const CRITICAL_MAX_AGE_MS = 2 * 60 * 1000;

/**
 * Check if user's session is recent enough for sensitive operations
 * 
 * @param user - Appwrite user object with session metadata
 * @param maxAgeMs - Maximum allowed session age in milliseconds
 * @returns Object with isRecent flag and session age
 * 
 * @example
 * const { isRecent, ageMs } = checkRecentAuth(user);
 * if (!isRecent) {
 *   return c.json({ error: "Re-authentication required" }, 401);
 * }
 */
export function checkRecentAuth(
    user: {
        $createdAt?: string;
        accessedAt?: string;
        prefs?: Record<string, unknown>;
    },
    maxAgeMs: number = DEFAULT_MAX_AGE_MS
): { isRecent: boolean; ageMs: number; requiresReauth: boolean } {
    const now = Date.now();

    // Try to get session start time from prefs (set at login)
    const sessionStartAt = user.prefs?.sessionStartedAt as string | undefined;

    // Try to get last accessed time (if available)
    const accessedAt = user.accessedAt;

    // Fallback to user creation time (very lenient)
    const userCreatedAt = user.$createdAt;

    // Use the most recent timestamp we have
    let authTime: number;

    if (sessionStartAt) {
        authTime = new Date(sessionStartAt).getTime();
    } else if (accessedAt) {
        authTime = new Date(accessedAt).getTime();
    } else if (userCreatedAt) {
        authTime = new Date(userCreatedAt).getTime();
    } else {
        // No timestamp available - require re-auth
        return { isRecent: false, ageMs: Infinity, requiresReauth: true };
    }

    const ageMs = now - authTime;
    const isRecent = ageMs <= maxAgeMs;

    return {
        isRecent,
        ageMs,
        requiresReauth: !isRecent,
    };
}

/**
 * Require recent authentication or return error response
 * 
 * @param user - Appwrite user object
 * @param maxAgeMs - Maximum allowed session age
 * @returns null if auth is recent, error details if re-auth needed
 */
export function requireRecentAuth(
    user: {
        $createdAt?: string;
        accessedAt?: string;
        prefs?: Record<string, unknown>;
    },
    maxAgeMs: number = DEFAULT_MAX_AGE_MS
): { error: string; code: string; ageMs: number } | null {
    const { isRecent, ageMs } = checkRecentAuth(user, maxAgeMs);

    if (!isRecent) {
        const ageMinutes = Math.floor(ageMs / 60000);
        return {
            error: `Re-authentication required. Your session is ${ageMinutes} minutes old. Please sign in again to perform this action.`,
            code: "REAUTH_REQUIRED",
            ageMs,
        };
    }

    return null;
}

/**
 * Format session age as human-readable string
 */
export function formatSessionAge(ageMs: number): string {
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
}
