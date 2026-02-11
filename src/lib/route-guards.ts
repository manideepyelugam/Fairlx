import "server-only";

import { createMiddleware } from "hono/factory";
import { Context } from "hono";
import { assertBillingNotSuspended, BillingError } from "./billing-primitives";
import { AuthorizationError } from "./authorization-guards";

/**
 * Production Hardening Middleware
 * 
 * Shared middleware for API routes that enforces:
 * - Billing status checks (suspend blocked)
 * - Workspace access validation with server-side orgId derivation
 * - Cross-org access prevention
 * 
 * USAGE:
 * Apply to routes that require workspace-level access:
 * 
 * ```typescript
 * import { workspaceGuard } from "@/lib/route-guards";
 * 
 * app.post("/tasks", sessionMiddleware, workspaceGuard, async (c) => {
 *     const secureContext = c.get("secureContext");
 *     // secureContext.organizationId is server-derived, never from client
 * });
 * ```
 */

// Context type for Hono with our custom variables
interface RouteGuardContext {
    Variables: {
        user: { $id: string; email: string; name?: string; prefs?: Record<string, unknown> };
        databases: import("node-appwrite").Databases;
        secureContext?: {
            workspaceId: string;
            organizationId: string | null;
            workspaceOwnerId: string | null;
            userRole: string;
            isOrgWorkspace: boolean;
        };
    };
}

/**
 * Extract workspaceId from request
 * Checks: query params and URL params
 * Note: JSON body extraction is handled by zValidator at route level
 */
function extractWorkspaceId(c: Context): string | null {
    // Try query params first
    const queryWorkspaceId = c.req.query("workspaceId");
    if (queryWorkspaceId) return queryWorkspaceId;

    // Try URL params
    const paramWorkspaceId = c.req.param("workspaceId");
    if (paramWorkspaceId) return paramWorkspaceId;

    return null;
}

/**
 * Workspace Guard Middleware
 * 
 * Enforces:
 * 1. User has access to the workspace
 * 2. Billing is not suspended
 * 3. Derives orgId server-side (never trust client)
 * 
 * Sets `secureContext` on the context with:
 * - workspaceId
 * - organizationId (server-derived)
 * - workspaceOwnerId
 * - userRole
 * - isOrgWorkspace
 */
export const workspaceGuard = createMiddleware<RouteGuardContext>(async (c, next) => {
    const user = c.get("user");
    const databases = c.get("databases");

    // Extract workspaceId from request
    const workspaceId = extractWorkspaceId(c);

    if (!workspaceId) {
        // No workspace context - allow through (some routes don't need workspace)
        await next();
        return;
    }

    try {
        // 1. Check workspace access with server-side orgId derivation
        const { getSecureWorkspaceContext } = await import("./authorization-guards");
        const secureContext = await getSecureWorkspaceContext(databases, user.$id, workspaceId);

        // 2. Check billing status
        await assertBillingNotSuspended(databases, {
            workspaceId,
            organizationId: secureContext.organizationId || undefined,
        });

        // 3. Set secure context for downstream handlers
        c.set("secureContext", secureContext);

        await next();
    } catch (error) {
        if (error instanceof BillingError) {
            return c.json({
                error: error.message,
                code: error.code,
            }, 403);
        }

        if (error instanceof AuthorizationError) {
            return c.json({
                error: error.message,
                code: error.code,
            }, 403);
        }

        // Re-throw unknown errors
        throw error;
    }
});

/**
 * Billing Guard Middleware (lighter version)
 * 
 * Only checks billing status, doesn't validate workspace access.
 * Use for routes where access is checked separately.
 */
export const billingGuard = createMiddleware<RouteGuardContext>(async (c, next) => {
    const databases = c.get("databases");

    // Extract workspaceId from request
    const workspaceId = extractWorkspaceId(c);

    if (!workspaceId) {
        await next();
        return;
    }

    try {
        await assertBillingNotSuspended(databases, { workspaceId });
        await next();
    } catch (error) {
        if (error instanceof BillingError) {
            return c.json({
                error: error.message,
                code: error.code,
            }, 403);
        }
        throw error;
    }
});

/**
 * Write Operation Guard
 * 
 * Use for mutating operations (POST, PUT, PATCH, DELETE).
 * Enforces strict billing checks.
 */
export const writeGuard = createMiddleware<RouteGuardContext>(async (c, next) => {
    const databases = c.get("databases");
    const workspaceId = extractWorkspaceId(c);

    if (!workspaceId) {
        await next();
        return;
    }

    try {
        // For write operations, use assertBillingActive for strict check
        const { assertBillingActive } = await import("./billing-primitives");
        await assertBillingActive(databases, { workspaceId });
        await next();
    } catch (error) {
        if (error instanceof BillingError) {
            // Allow if just DUE (grace period)
            if (error.code === "BILLING_DUE") {
                // Add warning header but allow
                c.header("X-Billing-Warning", "Payment is overdue");
                await next();
                return;
            }
            return c.json({
                error: error.message,
                code: error.code,
            }, 403);
        }
        throw error;
    }
});

/**
 * Organization Guard Middleware
 * 
 * Validates user is a member of the organization.
 * Use for org-level routes.
 */
export const organizationGuard = createMiddleware<RouteGuardContext>(async (c, next) => {
    const user = c.get("user");
    const databases = c.get("databases");

    // Try to get organizationId from query params
    const orgId = c.req.query("organizationId");

    if (!orgId) {
        await next();
        return;
    }

    try {
        const { assertOrgMembership } = await import("./authorization-guards");
        await assertOrgMembership(databases, user.$id, orgId);

        // Check billing for org
        await assertBillingNotSuspended(databases, { organizationId: orgId });

        await next();
    } catch (error) {
        if (error instanceof BillingError || error instanceof AuthorizationError) {
            return c.json({
                error: error.message,
                code: (error as BillingError | AuthorizationError).code,
            }, 403);
        }
        throw error;
    }
});

/**
 * Mutation Guard Middleware
 * 
 * Apply to all POST/PATCH/DELETE routes that modify data.
 * Combines workspace access validation with billing enforcement.
 * 
 * CRITICAL: This is the recommended guard for all mutation endpoints.
 * It ensures:
 * 1. User has access to the workspace
 * 2. OrgId is derived server-side (never trust client)
 * 3. Billing is not suspended
 * 
 * Usage:
 * ```typescript
 * app.post("/tasks", sessionMiddleware, mutationGuard, async (c) => {
 *     const secureContext = c.get("secureContext");
 *     // Safe to proceed with mutation
 * });
 * ```
 */
export const mutationGuard = createMiddleware<RouteGuardContext>(async (c, next) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const workspaceId = extractWorkspaceId(c);

    if (!workspaceId) {
        // No workspace context - allow through (some routes don't need workspace)
        await next();
        return;
    }

    try {
        // 1. Verify workspace access with server-side orgId derivation
        const { getSecureWorkspaceContext } = await import("./authorization-guards");
        const secureContext = await getSecureWorkspaceContext(databases, user.$id, workspaceId);

        // 2. Block if suspended (mutations not allowed)
        await assertBillingNotSuspended(databases, {
            workspaceId,
            organizationId: secureContext.organizationId || undefined,
        });

        // 3. Set secure context for downstream handlers
        c.set("secureContext", secureContext);

        await next();
    } catch (error) {
        if (error instanceof BillingError) {
            return c.json({
                error: "Your account is suspended due to an unpaid invoice. Please add credits to your wallet to restore access.",
                code: error.code,
                billingUrl: "/billing",
            }, 403);
        }

        if (error instanceof AuthorizationError) {
            return c.json({
                error: "You don't have permission to perform this action in this workspace.",
                code: error.code,
            }, 403);
        }

        throw error;
    }
});

