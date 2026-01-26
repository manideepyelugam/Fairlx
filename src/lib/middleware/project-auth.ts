import "server-only";

import { Databases } from "node-appwrite";
import {
    resolveUserProjectAccess,
    hasProjectPermission,
    ProjectPermissionKey,
} from "@/lib/permissions/resolveUserProjectAccess";
import { ProjectAccessResult } from "@/features/project-teams/types";

/**
 * Project Authorization Utilities
 * 
 * SINGLE SOURCE OF TRUTH for project-level authorization.
 * All API routes MUST use these helpers instead of inline role checks.
 * 
 * RULES:
 * 1. NO inline `MemberRole.ADMIN` checks in routes
 * 2. Use these helpers for all project access decisions
 * 3. Fail loudly in dev, log in prod
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ProjectAuthResult {
    success: true;
    access: ProjectAccessResult;
}

export interface ProjectAuthError {
    success: false;
    error: string;
    code: 401 | 403 | 404;
}

export type ProjectAuthOutcome = ProjectAuthResult | ProjectAuthError;

// =============================================================================
// MAIN AUTHORIZATION FUNCTION
// =============================================================================

/**
 * Assert project access with optional permission check.
 * 
 * USE THIS in all API routes that need project authorization.
 * 
 * @param databases - Appwrite Databases instance (not used, kept for API compat)
 * @param userId - User's Appwrite ID
 * @param projectId - Project to check access for
 * @param requiredPermission - Optional specific permission required
 * @returns ProjectAuthOutcome - either success + access, or error
 * 
 * @example
 * ```typescript
 * const auth = await requireProjectAuth(databases, userId, projectId, ProjectPermissionKey.EDIT_TASKS);
 * if (!auth.success) {
 *   return c.json({ error: auth.error }, auth.code);
 * }
 * // auth.access is now available with full permission data
 * ```
 */
export async function requireProjectAuth(
    _databases: Databases,
    userId: string,
    projectId: string,
    requiredPermission?: ProjectPermissionKey
): Promise<ProjectAuthOutcome> {
    if (!userId) {
        return {
            success: false,
            error: "Unauthorized: No user ID provided",
            code: 401,
        };
    }

    if (!projectId) {
        return {
            success: false,
            error: "Bad Request: No project ID provided",
            code: 404,
        };
    }

    // Resolve full access using the canonical resolver
    const access = await resolveUserProjectAccess(_databases, userId, projectId);

    // Check basic access
    if (!access.hasAccess) {
        return {
            success: false,
            error: "Forbidden: Not a project member",
            code: 403,
        };
    }

    // Check specific permission if required
    if (requiredPermission && !hasProjectPermission(access, requiredPermission)) {
        return {
            success: false,
            error: `Forbidden: Missing permission ${requiredPermission}`,
            code: 403,
        };
    }

    return {
        success: true,
        access,
    };
}

// =============================================================================
// HELPER PREDICATES
// =============================================================================

/**
 * Check if user can view project (basic access)
 */
export async function canViewProject(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(databases, userId, projectId);
    return result.success;
}

/**
 * Check if user can manage project members
 */
export async function canManageMembers(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(
        databases,
        userId,
        projectId,
        ProjectPermissionKey.MANAGE_MEMBERS
    );
    return result.success;
}

/**
 * Check if user can manage project teams
 */
export async function canManageTeams(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(
        databases,
        userId,
        projectId,
        ProjectPermissionKey.MANAGE_TEAMS
    );
    return result.success;
}

/**
 * Check if user can create tasks
 */
export async function canCreateTasks(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(
        databases,
        userId,
        projectId,
        ProjectPermissionKey.CREATE_TASKS
    );
    return result.success;
}

/**
 * Check if user can edit tasks
 */
export async function canEditTasks(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(
        databases,
        userId,
        projectId,
        ProjectPermissionKey.EDIT_TASKS
    );
    return result.success;
}

/**
 * Check if user can delete tasks
 */
export async function canDeleteTasks(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(
        databases,
        userId,
        projectId,
        ProjectPermissionKey.DELETE_TASKS
    );
    return result.success;
}

/**
 * Check if user can manage sprints
 */
export async function canManageSprints(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(
        databases,
        userId,
        projectId,
        ProjectPermissionKey.CREATE_SPRINTS
    );
    return result.success;
}

/**
 * Check if user can edit project settings
 */
export async function canEditSettings(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(
        databases,
        userId,
        projectId,
        ProjectPermissionKey.EDIT_SETTINGS
    );
    return result.success;
}

/**
 * Check if user is project owner or admin
 */
export async function isProjectAdmin(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(databases, userId, projectId);
    if (!result.success) return false;
    return result.access.isAdmin;
}

/**
 * Check if user is project owner
 */
export async function isProjectOwner(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const result = await requireProjectAuth(databases, userId, projectId);
    if (!result.success) return false;
    return result.access.isOwner;
}

// =============================================================================
// WORKSPACE ADMIN UTILITIES
// =============================================================================

/**
 * Check if user is a workspace admin (for workspace-level operations)
 * 
 * This is used when the operation is at workspace level, not project level.
 * For project operations, use requireProjectAuth which already handles
 * workspace admin override.
 */
export async function requireWorkspaceAdminForProject(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<ProjectAuthOutcome> {
    const result = await requireProjectAuth(databases, userId, projectId);
    if (!result.success) return result;

    // The resolver already gives workspace admins full access
    // So if they have access and are admin, they're good
    if (!result.access.isAdmin) {
        return {
            success: false,
            error: "Forbidden: Requires admin access",
            code: 403,
        };
    }

    return result;
}
