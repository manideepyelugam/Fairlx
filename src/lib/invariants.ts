/**
 * Runtime Invariants
 * 
 * Critical assertions that MUST hold true at all times.
 * These prevent the system from entering invalid states.
 * 
 * BEHAVIOR:
 * - Development: THROW errors (fail fast)
 * - Production: LOG violations and continue (prevent crashes)
 */

import "server-only";

import { type Databases, Query } from "node-appwrite";
import { DATABASE_ID, ORGANIZATION_MEMBERS_ID, WORKSPACES_ID } from "@/config";

// ============================================================================
// INVARIANT ASSERTION
// ============================================================================

export interface InvariantViolation {
    message: string;
    invariantName: string;
    context?: Record<string, unknown>;
    timestamp: string;
}

/**
 * Assert an invariant condition.
 * 
 * In development: throws an error
 * In production: logs the violation and continues
 * 
 * @param condition - The condition that must be true
 * @param invariantName - Name of the invariant being checked
 * @param message - Human-readable description of the violation
 * @param context - Additional context for debugging
 */
export function assertInvariant(
    condition: boolean,
    invariantName: string,
    message: string,
    context?: Record<string, unknown>
): asserts condition {
    if (!condition) {
        const violation: InvariantViolation = {
            message,
            invariantName,
            context,
            timestamp: new Date().toISOString(),
        };

        if (process.env.NODE_ENV === "development") {
            throw new Error(
                `[INVARIANT VIOLATION: ${invariantName}] ${message}\n` +
                `Context: ${JSON.stringify(context, null, 2)}`
            );
        } else {
            console.error("[INVARIANT VIOLATION]", JSON.stringify(violation));
        }
    }
}

// ============================================================================
// WORKSPACE-ORG MEMBERSHIP INVARIANTS
// ============================================================================

/**
 * INVARIANT: Workspace member MUST reference a valid org member
 * from the SAME organization that owns the workspace.
 * 
 * This prevents:
 * - Cross-org access
 * - Orphaned workspace members
 * - Direct user-workspace relationships
 */
export async function validateWorkspaceMemberInvariant(
    databases: Databases,
    workspaceMember: { orgMemberId: string; workspaceId: string }
): Promise<void> {
    const { orgMemberId, workspaceId } = workspaceMember;

    // Get the workspace
    const workspace = await databases.getDocument(
        DATABASE_ID,
        WORKSPACES_ID,
        workspaceId
    );

    // Personal workspaces don't have org members
    if (!workspace.organizationId) {
        // This is a personal workspace - cannot have new-style workspace members
        assertInvariant(
            false,
            "WORKSPACE_MEMBER_ORG_REQUIRED",
            "WorkspaceMember type should not be used for personal workspaces",
            { workspaceId, orgMemberId }
        );
        return;
    }

    // Get the org member
    const orgMember = await databases.getDocument(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        orgMemberId
    );

    // Org member must belong to the workspace's organization
    assertInvariant(
        orgMember.organizationId === workspace.organizationId,
        "WORKSPACE_ORG_MATCH",
        "Workspace member's org member must belong to the same organization as the workspace",
        {
            orgMemberId,
            workspaceId,
            orgMemberOrgId: orgMember.organizationId,
            workspaceOrgId: workspace.organizationId,
        }
    );
}

/**
 * INVARIANT: User cannot access workspace data without org membership
 * 
 * For ORG workspaces, user must be an org member before accessing any workspace.
 */
export async function validateUserOrgMembershipForWorkspace(
    databases: Databases,
    userId: string,
    workspaceId: string
): Promise<void> {
    // Get the workspace
    const workspace = await databases.getDocument(
        DATABASE_ID,
        WORKSPACES_ID,
        workspaceId
    );

    // Personal workspaces use legacy membership - this invariant doesn't apply
    if (!workspace.organizationId) {
        return;
    }

    // Check org membership
    const orgMembers = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        [
            Query.equal("organizationId", workspace.organizationId),
            Query.equal("userId", userId),
            Query.limit(1),
        ]
    );

    assertInvariant(
        orgMembers.total > 0,
        "USER_ORG_MEMBERSHIP_REQUIRED",
        "User must be an org member to access org workspace",
        {
            userId,
            workspaceId,
            organizationId: workspace.organizationId,
        }
    );
}

/**
 * INVARIANT: Org role does NOT grant workspace access
 * 
 * Having OWNER/ADMIN/MODERATOR org role should NOT automatically
 * grant access to workspace data. Access requires explicit workspace membership.
 * 
 * This is a validation helper, not an assertion - returns boolean for checking.
 */
export async function requiresExplicitWorkspaceMembership(
    databases: Databases,
    orgMemberId: string,
    workspaceId: string
): Promise<boolean> {
    // This invariant is informational - we always require explicit membership
    // The actual check happens in assertWorkspaceMembership
    console.info(
        `[INVARIANT INFO] Checking explicit workspace membership for orgMember=${orgMemberId}, workspace=${workspaceId}`
    );
    return true;
}

// ============================================================================
// ORG OWNERSHIP INVARIANTS
// ============================================================================

/**
 * INVARIANT: Organization must have at least one OWNER
 * 
 * Prevents orphaned organizations without administrative control.
 */
export async function validateOrgHasOwner(
    databases: Databases,
    organizationId: string
): Promise<void> {
    const owners = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        [
            Query.equal("organizationId", organizationId),
            Query.equal("role", "OWNER"),
            Query.limit(1),
        ]
    );

    assertInvariant(
        owners.total >= 1,
        "ORG_MUST_HAVE_OWNER",
        "Organization must have at least one OWNER",
        { organizationId }
    );
}

/**
 * INVARIANT: Cannot remove the last OWNER from an organization
 */
export async function validateNotLastOwner(
    databases: Databases,
    organizationId: string,
    orgMemberIdToRemove: string
): Promise<void> {
    const memberToRemove = await databases.getDocument(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        orgMemberIdToRemove
    );

    // Only check if removing an OWNER
    if (memberToRemove.role !== "OWNER") {
        return;
    }

    const owners = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        [
            Query.equal("organizationId", organizationId),
            Query.equal("role", "OWNER"),
            Query.limit(2), // We only need to know if there's more than 1
        ]
    );

    assertInvariant(
        owners.total > 1,
        "CANNOT_REMOVE_LAST_OWNER",
        "Cannot remove the last OWNER from organization",
        { organizationId, orgMemberIdToRemove }
    );
}

// ============================================================================
// SELF-CHECK (for observability)
// ============================================================================

/**
 * Run all invariant self-checks for an organization
 * Used for periodic validation and observability
 */
export async function runOrgInvariantSelfChecks(
    databases: Databases,
    organizationId: string
): Promise<{ passed: boolean; violations: InvariantViolation[] }> {
    const violations: InvariantViolation[] = [];

    try {
        await validateOrgHasOwner(databases, organizationId);
    } catch (error) {
        if (error instanceof Error && error.message.includes("INVARIANT VIOLATION")) {
            violations.push({
                message: error.message,
                invariantName: "ORG_MUST_HAVE_OWNER",
                context: { organizationId },
                timestamp: new Date().toISOString(),
            });
        }
    }

    return {
        passed: violations.length === 0,
        violations,
    };
}
