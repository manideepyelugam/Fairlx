import "server-only";

/**
 * Session Context System
 * 
 * ENTERPRISE SECURITY: Manages the user's active context (PERSONAL | ORG)
 * to ensure strict data isolation between personal and organization workspaces.
 * 
 * INVARIANTS:
 * - Context is stored in user prefs (persisted across sessions)
 * - Every protected request validates context matches resource ownership
 * - Context is auto-cleared when user leaves/is removed from org
 * - Cross-context data access is blocked at the middleware level
 */

export type ContextType = "PERSONAL" | "ORG";

export interface SessionContext {
    type: ContextType;
    ownerId: string; // userId for PERSONAL, organizationId for ORG
}

/**
 * Get active context from user prefs
 */
export function getActiveContext(
    userPrefs: Record<string, unknown>
): SessionContext | null {
    const contextType = userPrefs.activeContextType as ContextType | undefined;
    const contextOwnerId = userPrefs.activeContextOwnerId as string | undefined;

    if (!contextType || !contextOwnerId) {
        return null;
    }

    return {
        type: contextType,
        ownerId: contextOwnerId,
    };
}

/**
 * Set active context in user prefs
 * 
 * @returns Updated prefs object (caller must persist via account.updatePrefs)
 */
export function setActiveContext(
    userPrefs: Record<string, unknown>,
    context: SessionContext
): Record<string, unknown> {
    return {
        ...userPrefs,
        activeContextType: context.type,
        activeContextOwnerId: context.ownerId,
    };
}

/**
 * Clear active context from user prefs
 * 
 * Called when:
 * - User leaves an organization
 * - Organization is deleted
 * - User switches to a different context
 */
export function clearActiveContext(
    userPrefs: Record<string, unknown>
): Record<string, unknown> {
    const { activeContextType, activeContextOwnerId, ...rest } = userPrefs;
    // Suppress unused variable warnings
    void activeContextType;
    void activeContextOwnerId;
    return rest;
}

/**
 * Validate that workspace access is allowed for the given context
 * 
 * CRITICAL: This must be called on every workspace-scoped operation
 * 
 * @returns true if access is allowed, false if blocked
 */
export function validateWorkspaceContext(
    workspace: {
        ownerType?: string;
        ownerId?: string;
        organizationId?: string;
        userId?: string;
    },
    context: SessionContext,
    userId: string
): boolean {
    // For PERSONAL context, workspace must be owned by the user
    if (context.type === "PERSONAL") {
        // Check ownerType/ownerId if set
        if (workspace.ownerType === "PERSONAL") {
            return workspace.ownerId === userId && context.ownerId === userId;
        }
        // Fallback: check userId field (legacy workspaces)
        if (workspace.userId && !workspace.organizationId) {
            return workspace.userId === userId;
        }
        return false;
    }

    // For ORG context, workspace must belong to the organization
    if (context.type === "ORG") {
        // Check ownerType/ownerId if set
        if (workspace.ownerType === "ORG") {
            return workspace.ownerId === context.ownerId;
        }
        // Fallback: check organizationId field
        if (workspace.organizationId) {
            return workspace.organizationId === context.ownerId;
        }
        return false;
    }

    return false;
}

/**
 * Validate that user has valid org membership for ORG context
 * 
 * @param orgMemberships - List of org IDs user is member of
 * @param context - Current session context
 * @returns true if context is valid
 */
export function validateOrgMembership(
    orgMemberships: string[],
    context: SessionContext
): boolean {
    if (context.type !== "ORG") {
        return true; // Not an ORG context, no org membership required
    }

    return orgMemberships.includes(context.ownerId);
}
