"use client";

import { OrgPermissionKey, ORG_PERMISSION_METADATA } from "@/features/org-permissions/types";

// ============================================================================
// PERMISSION ROUTE MAP
// ============================================================================

interface RoutePermissionEntry {
    route: string;
    permission: OrgPermissionKey;
    tabs?: TabPermission[];
}

interface TabPermission {
    tab: string;
    permission: OrgPermissionKey;
}

/**
 * Permission-to-route mapping for org settings
 */
export const PERMISSION_ROUTE_MAP: RoutePermissionEntry[] = [
    {
        route: "/organization",
        permission: OrgPermissionKey.MEMBERS_VIEW,
        tabs: [
            { tab: "general", permission: OrgPermissionKey.SETTINGS_MANAGE },
            { tab: "members", permission: OrgPermissionKey.MEMBERS_VIEW },
            { tab: "security", permission: OrgPermissionKey.SECURITY_VIEW },
            { tab: "departments", permission: OrgPermissionKey.DEPARTMENTS_MANAGE },
            { tab: "billing", permission: OrgPermissionKey.BILLING_VIEW },
            { tab: "audit", permission: OrgPermissionKey.AUDIT_VIEW },
            { tab: "permissions", permission: OrgPermissionKey.PERMISSIONS_MANAGE },
        ],
    },
];

// ============================================================================
// NAVIGATION RESOLVER
// ============================================================================

/**
 * Get visible tabs based on user permissions
 */
export function getVisibleTabs(
    route: string,
    hasPermission: (permission: OrgPermissionKey) => boolean
): string[] {
    const entry = PERMISSION_ROUTE_MAP.find(
        (entry: RoutePermissionEntry) => entry.route === route
    );

    if (!entry || !entry.tabs) {
        return [];
    }

    return entry.tabs
        .filter((t: TabPermission) => hasPermission(t.permission))
        .map((t: TabPermission) => t.tab);
}

/**
 * Check if user can access a specific tab
 */
export function canAccessTab(
    route: string,
    tab: string,
    hasPermission: (permission: OrgPermissionKey) => boolean
): boolean {
    const entry = PERMISSION_ROUTE_MAP.find(
        (entry: RoutePermissionEntry) => entry.route === route
    );

    if (!entry || !entry.tabs) {
        return true; // No restriction defined
    }

    const tabEntry = entry.tabs.find((t: TabPermission) => t.tab === tab);
    if (!tabEntry) {
        return true; // Tab not in list, assume allowed
    }

    return hasPermission(tabEntry.permission);
}

/**
 * Get default tab for a route based on permissions
 */
export function getDefaultTab(
    route: string,
    hasPermission: (permission: OrgPermissionKey) => boolean
): string | null {
    const visibleTabs = getVisibleTabs(route, hasPermission);
    return visibleTabs.length > 0 ? visibleTabs[0] : null;
}

/**
 * Get permission label for UI display
 */
export function getPermissionLabel(permission: OrgPermissionKey): string {
    return ORG_PERMISSION_METADATA[permission]?.label || permission;
}

/**
 * Get all permissions required for a route
 */
export function getRoutePermissions(route: string): OrgPermissionKey[] {
    const entry = PERMISSION_ROUTE_MAP.find(
        (entry: RoutePermissionEntry) => entry.route === route
    );

    if (!entry) {
        return [];
    }

    const permissions = [entry.permission];
    if (entry.tabs) {
        permissions.push(...entry.tabs.map((p: TabPermission) => p.permission));
    }

    return [...new Set(permissions)];
}
