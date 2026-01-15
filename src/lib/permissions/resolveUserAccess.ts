import "server-only";

import { Databases, Query } from "node-appwrite";
import { DATABASE_ID, ORGANIZATION_MEMBERS_ID, ORG_MEMBER_PERMISSIONS_ID } from "@/config";
import { OrganizationRole, OrgMemberStatus, OrganizationMember } from "@/features/organizations/types";
import { OrgPermissionKey } from "@/features/org-permissions/types";
import { AppRouteKey } from "./appRouteKeys";
import { getRouteKeysForPermissions, getPathsForRouteKeys, getAllRouteKeys } from "./permissionRouteMap";

/**
 * Resolve User Access
 * 
 * Server-side permission resolver that computes the complete access
 * object for a user in an organization.
 * 
 * RULES:
 * 1. OWNER always gets ALL routes (bypass all checks)
 * 2. Explicit permissions are checked first
 * 3. Role defaults are fallback
 * 4. Output includes allowed routes and permissions
 * 
 * This function is the ONLY authority for permission and access decisions.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface UserAccess {
    /** Route keys the user can access */
    allowedRouteKeys: AppRouteKey[];
    /** Concrete paths the user can access (resolved from route keys) */
    allowedPaths: string[];
    /** Whether user is org OWNER (super-role) */
    isOwner: boolean;
    /** User's org role */
    role: OrganizationRole | null;
    /** All permissions user has (explicit + role defaults) */
    permissions: OrgPermissionKey[];
    /** User's org member ID */
    orgMemberId: string | null;
    /** Organization ID */
    organizationId: string | null;
}

// ============================================================================
// ROLE DEFAULT PERMISSIONS
// ============================================================================

const ROLE_DEFAULT_PERMISSIONS: Record<OrganizationRole, OrgPermissionKey[]> = {
    [OrganizationRole.OWNER]: Object.values(OrgPermissionKey) as OrgPermissionKey[],
    [OrganizationRole.ADMIN]: [
        OrgPermissionKey.BILLING_VIEW,
        OrgPermissionKey.MEMBERS_VIEW,
        OrgPermissionKey.MEMBERS_MANAGE,
        OrgPermissionKey.SETTINGS_MANAGE,
        OrgPermissionKey.AUDIT_VIEW,
        OrgPermissionKey.DEPARTMENTS_MANAGE,
        OrgPermissionKey.SECURITY_VIEW,
        OrgPermissionKey.WORKSPACE_CREATE,
        OrgPermissionKey.WORKSPACE_ASSIGN,
    ],
    [OrganizationRole.MODERATOR]: [
        OrgPermissionKey.MEMBERS_VIEW,
        OrgPermissionKey.WORKSPACE_ASSIGN,
    ],
    [OrganizationRole.MEMBER]: [],
};

// ============================================================================
// BASE ROUTE KEYS (always accessible)
// ============================================================================

/**
 * Route keys that are always accessible to authenticated users
 * regardless of org permissions
 */
const ALWAYS_ACCESSIBLE_ROUTES: AppRouteKey[] = [
    AppRouteKey.PROFILE,
    AppRouteKey.PROFILE_ACCOUNT,
    AppRouteKey.PROFILE_PASSWORD,
    AppRouteKey.WELCOME,
];

/**
 * Route keys that are accessible to any org member
 */
const ORG_MEMBER_BASE_ROUTES: AppRouteKey[] = [
    AppRouteKey.WORKSPACES,
];

/**
 * Route keys accessible for workspace members
 */
const WORKSPACE_MEMBER_ROUTES: AppRouteKey[] = [
    AppRouteKey.WORKSPACE_HOME,
    AppRouteKey.WORKSPACE_TASKS,
    AppRouteKey.WORKSPACE_TEAMS,
    AppRouteKey.WORKSPACE_PROGRAMS,
    AppRouteKey.WORKSPACE_TIMELINE,
    AppRouteKey.WORKSPACE_SETTINGS,
    AppRouteKey.WORKSPACE_SPACES,
    AppRouteKey.WORKSPACE_PROJECTS,
];

// ============================================================================
// MAIN RESOLVER
// ============================================================================

interface OrgMemberPermission {
    orgMemberId: string;
    permissionKey: string;
}

/**
 * Resolve user's complete access for an organization
 * 
 * @param databases - Appwrite databases instance
 * @param userId - User ID
 * @param organizationId - Organization ID (optional - if not provided, returns minimal access)
 * @param workspaceId - Active workspace ID (optional - used to resolve workspace routes)
 * @returns Complete UserAccess object
 */
export async function resolveUserAccess(
    databases: Databases,
    userId: string,
    organizationId?: string,
    workspaceId?: string
): Promise<UserAccess> {
    // Default access (no org context)
    const baseAccess: UserAccess = {
        allowedRouteKeys: [...ALWAYS_ACCESSIBLE_ROUTES],
        allowedPaths: [],
        isOwner: false,
        role: null,
        permissions: [],
        orgMemberId: null,
        organizationId: organizationId || null,
    };

    if (!organizationId) {
        // No org context - return base access with profile routes
        baseAccess.allowedPaths = getPathsForRouteKeys(baseAccess.allowedRouteKeys, workspaceId);
        return baseAccess;
    }

    try {
        // 1. Get user's org membership
        const membership = await databases.listDocuments<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", organizationId),
                Query.equal("userId", userId),
                Query.equal("status", OrgMemberStatus.ACTIVE),
            ]
        );

        if (membership.total === 0) {
            // Not an org member - return base access
            baseAccess.allowedPaths = getPathsForRouteKeys(baseAccess.allowedRouteKeys, workspaceId);
            return baseAccess;
        }

        const member = membership.documents[0];
        const role = member.role as OrganizationRole;

        // 2. OWNER SUPER-ROLE: Grant ALL access immediately
        if (role === OrganizationRole.OWNER) {
            const allRouteKeys = getAllRouteKeys();
            return {
                allowedRouteKeys: allRouteKeys,
                allowedPaths: getPathsForRouteKeys(allRouteKeys, workspaceId),
                isOwner: true,
                role: OrganizationRole.OWNER,
                permissions: Object.values(OrgPermissionKey) as OrgPermissionKey[],
                orgMemberId: member.$id,
                organizationId,
            };
        }

        // 3. Get explicit user permissions
        let explicitPermissions: OrgPermissionKey[] = [];
        try {
            const explicitPerms = await databases.listDocuments(
                DATABASE_ID,
                ORG_MEMBER_PERMISSIONS_ID,
                [Query.equal("orgMemberId", member.$id)]
            );

            explicitPermissions = explicitPerms.documents.map(
                (p) => (p as unknown as OrgMemberPermission).permissionKey as OrgPermissionKey
            );
        } catch {
            // Collection may not exist yet - continue with role defaults only
        }

        // 4. Combine explicit permissions with role defaults
        const roleDefaults = ROLE_DEFAULT_PERMISSIONS[role] || [];
        const allPermissions = [...new Set([...explicitPermissions, ...roleDefaults])];

        // 5. Resolve route keys from permissions
        const permissionRouteKeys = getRouteKeysForPermissions(allPermissions);

        // 6. Combine all route keys
        const allRouteKeys = [
            ...ALWAYS_ACCESSIBLE_ROUTES,
            ...ORG_MEMBER_BASE_ROUTES,
            ...permissionRouteKeys,
            // Add workspace routes if workspace context exists
            ...(workspaceId ? WORKSPACE_MEMBER_ROUTES : []),
        ];

        // 7. De-duplicate and resolve paths
        const uniqueRouteKeys = [...new Set(allRouteKeys)];

        return {
            allowedRouteKeys: uniqueRouteKeys,
            allowedPaths: getPathsForRouteKeys(uniqueRouteKeys, workspaceId),
            isOwner: false,
            role,
            permissions: allPermissions,
            orgMemberId: member.$id,
            organizationId,
        };
    } catch (error) {
        console.error("[resolveUserAccess] Error resolving access:", error);
        // On error, return base access only
        baseAccess.allowedPaths = getPathsForRouteKeys(baseAccess.allowedRouteKeys, workspaceId);
        return baseAccess;
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(access: UserAccess, permission: OrgPermissionKey): boolean {
    if (access.isOwner) return true;
    return access.permissions.includes(permission);
}

/**
 * Check if user can access a specific route key
 */
export function canAccessRouteKey(access: UserAccess, routeKey: AppRouteKey): boolean {
    if (access.isOwner) return true;
    return access.allowedRouteKeys.includes(routeKey);
}

/**
 * Get user access for PERSONAL accounts (no org)
 * Personal accounts have full access to their own workspaces
 */
export function resolvePersonalUserAccess(workspaceId?: string): UserAccess {
    const routeKeys = [
        ...ALWAYS_ACCESSIBLE_ROUTES,
        AppRouteKey.WORKSPACES,
        AppRouteKey.WORKSPACE_CREATE,
        ...(workspaceId ? WORKSPACE_MEMBER_ROUTES : []),
    ];

    return {
        allowedRouteKeys: routeKeys,
        allowedPaths: getPathsForRouteKeys(routeKeys, workspaceId),
        isOwner: false,
        role: null,
        permissions: [],
        orgMemberId: null,
        organizationId: null,
    };
}
