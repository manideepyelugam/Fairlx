import "server-only";

import { OrgPermissionKey } from "@/features/org-permissions/types";
import { AppRouteKey } from "./appRouteKeys";

/**
 * Permission Route Map
 * 
 * Maps permissions to allowed routes. This is the ONLY place where
 * permissions are translated into route access.
 * 
 * RULES:
 * - Each OrgPermissionKey grants access to specific AppRouteKeys
 * - Route paths are defined here for each AppRouteKey
 * - OWNER role bypasses all checks (handled in resolveUserAccess.ts)
 * 
 * INVARIANT:
 * - No other file may infer routes from permissions
 * - All permission → route logic lives HERE
 */

// ============================================================================
// PERMISSION → ROUTE KEY MAPPING
// ============================================================================

/**
 * Maps each permission to the route keys it grants access to
 */
export const PERMISSION_TO_ROUTE_KEYS: Record<OrgPermissionKey, AppRouteKey[]> = {
    // Billing
    [OrgPermissionKey.BILLING_VIEW]: [
        AppRouteKey.ORG_BILLING,
        AppRouteKey.ORG_USAGE,
    ],
    [OrgPermissionKey.BILLING_MANAGE]: [
        AppRouteKey.ORG_BILLING,
        AppRouteKey.ORG_USAGE,
    ],

    // Members
    [OrgPermissionKey.MEMBERS_VIEW]: [
        AppRouteKey.ORG_DASHBOARD,
        AppRouteKey.ORG_MEMBERS,
    ],
    [OrgPermissionKey.MEMBERS_MANAGE]: [
        AppRouteKey.ORG_DASHBOARD,
        AppRouteKey.ORG_MEMBERS,
    ],

    // Settings
    [OrgPermissionKey.SETTINGS_MANAGE]: [
        AppRouteKey.ORG_SETTINGS,
    ],

    // Audit
    [OrgPermissionKey.AUDIT_VIEW]: [
        AppRouteKey.ORG_AUDIT,
    ],
    [OrgPermissionKey.COMPLIANCE_VIEW]: [
        AppRouteKey.ORG_AUDIT,
    ],

    // Departments
    [OrgPermissionKey.DEPARTMENTS_MANAGE]: [
        AppRouteKey.ORG_DEPARTMENTS,
    ],

    // Security
    [OrgPermissionKey.SECURITY_VIEW]: [
        AppRouteKey.ORG_SECURITY,
    ],

    // Workspaces
    [OrgPermissionKey.WORKSPACE_CREATE]: [
        AppRouteKey.WORKSPACES,
        AppRouteKey.WORKSPACE_CREATE,
    ],
    [OrgPermissionKey.WORKSPACE_ASSIGN]: [
        AppRouteKey.WORKSPACES,
    ],

    // Permissions management
    [OrgPermissionKey.PERMISSIONS_MANAGE]: [
        AppRouteKey.ORG_PERMISSIONS,
    ],
};

// ============================================================================
// ROUTE KEY → PATH MAPPING
// ============================================================================

/**
 * Maps each route key to its concrete Next.js path pattern
 * 
 * Paths with [workspaceId] are workspace-scoped and will be
 * resolved with the actual workspace ID at runtime
 */
export const ROUTE_KEY_TO_PATH: Record<AppRouteKey, string> = {
    // Org routes (dashboard-level, no workspace prefix)
    [AppRouteKey.ORG_DASHBOARD]: "/organization",
    [AppRouteKey.ORG_MEMBERS]: "/organization?tab=members",
    [AppRouteKey.ORG_SETTINGS]: "/organization?tab=general",
    [AppRouteKey.ORG_BILLING]: "/organization?tab=billing",
    [AppRouteKey.ORG_USAGE]: "/organization/usage",
    [AppRouteKey.ORG_AUDIT]: "/organization?tab=audit",
    [AppRouteKey.ORG_DEPARTMENTS]: "/organization/departments",
    [AppRouteKey.ORG_SECURITY]: "/organization?tab=security",
    [AppRouteKey.ORG_PERMISSIONS]: "/organization?tab=permissions",

    // Workspace routes
    [AppRouteKey.WORKSPACES]: "/",
    [AppRouteKey.WORKSPACE_CREATE]: "/workspaces/create",
    [AppRouteKey.WORKSPACE_HOME]: "/workspaces/[workspaceId]",
    [AppRouteKey.WORKSPACE_TASKS]: "/workspaces/[workspaceId]/tasks",
    [AppRouteKey.WORKSPACE_TEAMS]: "/workspaces/[workspaceId]/teams",
    [AppRouteKey.WORKSPACE_PROGRAMS]: "/workspaces/[workspaceId]/programs",
    [AppRouteKey.WORKSPACE_TIMELINE]: "/workspaces/[workspaceId]/timeline",
    [AppRouteKey.WORKSPACE_SETTINGS]: "/workspaces/[workspaceId]/settings",
    [AppRouteKey.WORKSPACE_SPACES]: "/workspaces/[workspaceId]/spaces",
    [AppRouteKey.WORKSPACE_PROJECTS]: "/workspaces/[workspaceId]/projects",

    // Profile routes
    [AppRouteKey.PROFILE]: "/profile",
    [AppRouteKey.PROFILE_ACCOUNT]: "/profile/accountinfo",
    [AppRouteKey.PROFILE_PASSWORD]: "/profile/password",

    // System routes
    [AppRouteKey.WELCOME]: "/welcome",
};

// ============================================================================
// TAB → ROUTE KEY MAPPING (for org settings tabs)
// ============================================================================

export interface TabRouteMapping {
    tab: string;
    routeKey: AppRouteKey;
    permission: OrgPermissionKey;
}

/**
 * Maps organization settings tabs to their required permissions
 */
export const ORG_SETTINGS_TABS: TabRouteMapping[] = [
    { tab: "general", routeKey: AppRouteKey.ORG_SETTINGS, permission: OrgPermissionKey.SETTINGS_MANAGE },
    { tab: "members", routeKey: AppRouteKey.ORG_MEMBERS, permission: OrgPermissionKey.MEMBERS_VIEW },
    { tab: "security", routeKey: AppRouteKey.ORG_SECURITY, permission: OrgPermissionKey.SECURITY_VIEW },
    { tab: "departments", routeKey: AppRouteKey.ORG_DEPARTMENTS, permission: OrgPermissionKey.DEPARTMENTS_MANAGE },
    { tab: "billing", routeKey: AppRouteKey.ORG_BILLING, permission: OrgPermissionKey.BILLING_VIEW },
    { tab: "audit", routeKey: AppRouteKey.ORG_AUDIT, permission: OrgPermissionKey.AUDIT_VIEW },
    { tab: "permissions", routeKey: AppRouteKey.ORG_PERMISSIONS, permission: OrgPermissionKey.PERMISSIONS_MANAGE },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all route keys granted by a set of permissions
 */
export function getRouteKeysForPermissions(permissions: OrgPermissionKey[]): AppRouteKey[] {
    const routeKeys = new Set<AppRouteKey>();

    for (const permission of permissions) {
        const keys = PERMISSION_TO_ROUTE_KEYS[permission];
        if (keys) {
            keys.forEach(key => routeKeys.add(key));
        }
    }

    return Array.from(routeKeys);
}

/**
 * Get the concrete path for a route key
 */
export function getPathForRouteKey(key: AppRouteKey, workspaceId?: string): string {
    let path = ROUTE_KEY_TO_PATH[key];

    if (workspaceId && path.includes("[workspaceId]")) {
        path = path.replace("[workspaceId]", workspaceId);
    }

    return path;
}

/**
 * Get all concrete paths for a set of route keys
 */
export function getPathsForRouteKeys(keys: AppRouteKey[], workspaceId?: string): string[] {
    return keys.map(key => getPathForRouteKey(key, workspaceId));
}

/**
 * Check if a path matches a route key pattern
 */
export function pathMatchesRouteKey(path: string, key: AppRouteKey): boolean {
    const pattern = ROUTE_KEY_TO_PATH[key];

    // Handle exact matches
    if (path === pattern) return true;

    // Handle tab-based matches (e.g., /organization?tab=billing)
    if (pattern.includes("?tab=")) {
        const [basePath, tabQuery] = pattern.split("?");
        if (path.startsWith(basePath)) {
            // Check if the path contains the tab query
            return path.includes(tabQuery);
        }
    }

    // Handle workspace-scoped paths
    if (pattern.includes("[workspaceId]")) {
        const regex = new RegExp(
            "^" + pattern.replace("[workspaceId]", "[^/]+") + "(?:\\?.*)?$"
        );
        return regex.test(path);
    }

    // Handle base path matches (e.g., /organization matches /organization)
    return path.split("?")[0] === pattern.split("?")[0];
}

/**
 * Get the route key for a given path
 */
export function getRouteKeyForPath(path: string): AppRouteKey | null {
    for (const key of Object.keys(ROUTE_KEY_TO_PATH)) {
        if (pathMatchesRouteKey(path, key as AppRouteKey)) {
            return key as AppRouteKey;
        }
    }
    return null;
}

/**
 * Get visible tabs based on allowed route keys
 */
export function getVisibleOrgTabs(allowedRouteKeys: AppRouteKey[]): string[] {
    return ORG_SETTINGS_TABS
        .filter(tab => allowedRouteKeys.includes(tab.routeKey))
        .map(tab => tab.tab);
}

/**
 * Get the default tab for org settings based on permissions
 */
export function getDefaultOrgTab(allowedRouteKeys: AppRouteKey[]): string | null {
    const visibleTabs = getVisibleOrgTabs(allowedRouteKeys);
    return visibleTabs.length > 0 ? visibleTabs[0] : null;
}

/**
 * Check if a tab is accessible based on route keys
 */
export function canAccessOrgTab(tab: string, allowedRouteKeys: AppRouteKey[]): boolean {
    const tabMapping = ORG_SETTINGS_TABS.find(t => t.tab === tab);
    if (!tabMapping) return false;
    return allowedRouteKeys.includes(tabMapping.routeKey);
}

// ============================================================================
// ALL ROUTE KEYS (for OWNER super-role)
// ============================================================================

/**
 * Get all route keys - used for OWNER super-role
 */
export function getAllRouteKeys(): AppRouteKey[] {
    return Object.values(AppRouteKey);
}
