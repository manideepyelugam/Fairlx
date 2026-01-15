import "server-only";

import { redirect } from "next/navigation";
import { AppRouteKey } from "./appRouteKeys";
import { UserAccess, canAccessRouteKey } from "./resolveUserAccess";
import { getRouteKeyForPath, getPathForRouteKey, getVisibleOrgTabs } from "./permissionRouteMap";

/**
 * Guard Route Access
 * 
 * Server-side route guard for Next.js App Router layouts and pages.
 * 
 * BEHAVIOR:
 * - If route NOT in allowedPaths → redirect to /403
 * - OWNER is never blocked
 * - No client-side enforcement
 * 
 * USAGE:
 * In layout.tsx or page.tsx server components:
 * 
 * ```typescript
 * import { guardRouteAccess } from "@/lib/permissions/guardRouteAccess";
 * 
 * export default async function Page() {
 *     const access = await resolveUserAccess(...);
 *     guardRouteAccess(currentPath, access);
 *     // If we reach here, access is allowed
 * }
 * ```
 */

// ============================================================================
// ROUTE GUARD FUNCTIONS
// ============================================================================

/**
 * Guard route access - redirects to /403 if access denied
 * 
 * @param currentPath - Current URL path
 * @param access - User access object from resolveUserAccess
 * @throws Redirect to /403 if access denied
 */
export function guardRouteAccess(currentPath: string, access: UserAccess): void {
    // OWNER is never blocked
    if (access.isOwner) return;

    // Check if path is allowed
    if (isPathAllowed(currentPath, access)) return;

    // Access denied - redirect to 403
    redirect("/403");
}

/**
 * Guard route access by route key - redirects to /403 if access denied
 * 
 * @param routeKey - AppRouteKey to check
 * @param access - User access object from resolveUserAccess
 * @throws Redirect to /403 if access denied
 */
export function guardRouteKeyAccess(routeKey: AppRouteKey, access: UserAccess): void {
    // OWNER is never blocked
    if (access.isOwner) return;

    // Check if route key is allowed
    if (canAccessRouteKey(access, routeKey)) return;

    // Access denied - redirect to 403
    redirect("/403");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a path is allowed based on user access
 * Does NOT redirect - just returns boolean
 */
export function isPathAllowed(path: string, access: UserAccess): boolean {
    // OWNER always has access
    if (access.isOwner) return true;

    // Get the route key for this path
    const routeKey = getRouteKeyForPath(path);

    if (!routeKey) {
        // Unknown route - for now, allow access
        // This handles dynamic routes and routes not in our map
        return true;
    }

    return access.allowedRouteKeys.includes(routeKey);
}

/**
 * Check if a route key is allowed based on user access
 * Does NOT redirect - just returns boolean
 */
export function isRouteKeyAllowed(routeKey: AppRouteKey, access: UserAccess): boolean {
    if (access.isOwner) return true;
    return access.allowedRouteKeys.includes(routeKey);
}

/**
 * Get fallback route for denied access
 * Returns the best route the user CAN access
 */
export function getFallbackRoute(access: UserAccess): string {
    // Priority order for fallback
    const fallbackOrder: AppRouteKey[] = [
        AppRouteKey.ORG_DASHBOARD,
        AppRouteKey.WORKSPACES,
        AppRouteKey.WELCOME,
        AppRouteKey.PROFILE,
    ];

    for (const routeKey of fallbackOrder) {
        if (access.allowedRouteKeys.includes(routeKey)) {
            // Return the path for this route key
            return getPathForRouteKey(routeKey);
        }
    }

    // Ultimate fallback
    return "/welcome";
}

/**
 * Guard tab access for organization settings
 * Returns the correct tab to show or redirects if no tabs are accessible
 */
export function guardOrgTabAccess(
    requestedTab: string | undefined,
    access: UserAccess
): string {
    // OWNER can access all tabs
    if (access.isOwner) return requestedTab || "general";

    const visibleTabs = getVisibleOrgTabs(access.allowedRouteKeys);

    // If no tabs are visible, redirect to 403
    if (visibleTabs.length === 0) {
        redirect("/403");
    }

    // If requested tab is visible, use it
    if (requestedTab && visibleTabs.includes(requestedTab)) {
        return requestedTab;
    }

    // Otherwise, use the first visible tab
    return visibleTabs[0];
}

// ============================================================================
// LAYOUT-LEVEL GUARD
// ============================================================================

/**
 * Layout-level access context that can be passed to child components
 */
export interface AccessContext {
    access: UserAccess;
    currentPath: string;
}

/**
 * Create access context for passing to child components
 */
export function createAccessContext(access: UserAccess, currentPath: string): AccessContext {
    return { access, currentPath };
}
