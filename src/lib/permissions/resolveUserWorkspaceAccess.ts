import "server-only";

import { Databases, Query, Models } from "node-appwrite";
import { DATABASE_ID, WORKSPACES_ID, MEMBERS_ID } from "@/config";
import { resolveUserOrgAccess, hasAnyOrgAccess } from "./resolveUserOrgAccess";

// ============================================================================
// TYPES
// ============================================================================

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface WorkspaceAccessResult {
    workspaceId: string;
    organizationId: string | null;

    /** Is this a personal workspace? */
    isPersonal: boolean;

    /** 
     * User's explicit role in the workspace.
     * Null if not a direct member (even if they have org access).
     */
    role: WorkspaceRole | null;

    /** Can the user see this workspace exists? */
    canList: boolean;

    /** Can the user read workspace data (projects, tasks)? */
    canRead: boolean;

    /** Can the user write workspace data? */
    canWrite: boolean;

    /** Can the user delete/administer the workspace? */
    canDelete: boolean; // usually ADMIN/OWNER

    /** Is the user a direct member of this workspace? */
    isDirectMember: boolean;

    /** Is the user an Org Owner (implies full access)? */
    isOrgOwner: boolean;

    /** Raw member document (for backward compatibility) */
    memberDocument?: Models.Document;
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve User Workspace Access
 * 
 * Determines user's access to a specific workspace.
 * 
 * RULES:
 * 1. ORG OWNER: Full access to all workspaces in org.
 * 2. PERSONAL: Must be OWNER (direct member).
 * 3. ORG WORKSPACE:
 *    - LIST: Allowed if user is Org Member (with valid department).
 *    - READ/WRITE/DELETE: Requires EXPLICIT workspace membership.
 */
export async function resolveUserWorkspaceAccess(
    databases: Databases,
    userId: string,
    workspaceId: string
): Promise<WorkspaceAccessResult> {

    // Default: No access
    const noAccess: WorkspaceAccessResult = {
        workspaceId,
        organizationId: null,
        isPersonal: false,
        role: null,
        canList: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        isDirectMember: false,
        isOrgOwner: false,
    };

    try {
        // 1. Fetch Workspace
        const workspace = await databases.getDocument(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId
        );

        if (!workspace) return noAccess;

        const organizationId = workspace.organizationId || null;
        const isPersonal = !organizationId;

        // 2. Check Direct Membership
        const directMembers = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.equal("userId", userId),
            ]
        );

        const rawMember = directMembers.total > 0 ? directMembers.documents[0] : null;

        // Soft-delete check: A DELETED member is effectively no member
        const directMember = (rawMember && rawMember.status !== "DELETED") ? rawMember : null;
        const directRole = directMember ? (directMember.role as WorkspaceRole) : null;

        // 3. Resolve Org Access (if applicable)
        let isOrgOwner = false;
        let hasDepartmentAccess = false;
        let orgMemberId: string | null = null;
        let orgRole: string | null = null;

        if (organizationId) {
            const orgAccess = await resolveUserOrgAccess(databases, userId, organizationId);
            isOrgOwner = orgAccess.isOwner;
            hasDepartmentAccess = hasAnyOrgAccess(orgAccess);
            orgMemberId = orgAccess.orgMemberId;
            orgRole = orgAccess.role;
        }

        // ============================================================
        // ACCESS LOGIC
        // ============================================================

        // CASE 1: Org Owner (Full Access Override)
        if (isOrgOwner) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const syntheticMember: any = directMember || {
                $id: "synthetic-org-owner",
                userId,
                workspaceId,
                role: "OWNER", // Treat as OWNER
                organizationId,
                isOrgMember: true,
                orgMemberId,
            };

            return {
                workspaceId,
                organizationId,
                isPersonal,
                role: directRole || "OWNER",
                canList: true,
                canRead: true,
                canWrite: true,
                canDelete: true,
                isDirectMember: !!directMember,
                isOrgOwner: true,
                memberDocument: syntheticMember,
            };
        }

        // CASE 2: Personal Workspace
        if (isPersonal) {
            // Must be direct member (OWNER)
            if (!directMember) return noAccess;

            return {
                workspaceId,
                organizationId: null,
                isPersonal: true,
                role: directRole,
                canList: true,
                canRead: true,
                canWrite: true,
                canDelete: directRole === "OWNER",
                isDirectMember: true,
                isOrgOwner: false,
                memberDocument: directMember,
            };
        }

        // CASE 3: Org Workspace (Non-Owner)
        // LIST Access: Requires valid org membership (departments assigned) OR direct membership
        const canList = hasDepartmentAccess || !!directMember;

        if (!canList) return noAccess; // Not in org (or no depts), not in workspace -> No access

        // READ Access: Requires Direct Membership
        const canRead = !!directMember;

        // WRITE Access: Direct Member
        const canWrite = !!directMember && ["OWNER", "ADMIN", "MEMBER"].includes(directRole || "");

        // DELETE Access: Direct Admin/Owner
        const canDelete = !!directMember && ["OWNER", "ADMIN"].includes(directRole || "");

        // Construct synthetic member for listing purposes only (if not direct)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memberDoc: any = directMember || (canList ? {
            $id: "synthetic-org-member",
            userId,
            workspaceId,
            role: orgRole || "MEMBER",
            organizationId,
            isOrgMember: true,
            orgMemberId,
        } : undefined);

        return {
            workspaceId,
            organizationId,
            isPersonal: false,
            role: directRole,
            canList,
            canRead,
            canWrite,
            canDelete,
            isDirectMember: !!directMember,
            isOrgOwner: false,
            memberDocument: memberDoc,
        };

    } catch (error: unknown) {
        const appwriteError = error as { code?: number; type?: string };
        if (appwriteError.code === 404 || appwriteError.type === "document_not_found") {
            // Workspace not found - return no access without spamming logs
            return noAccess;
        }
        console.error("[resolveUserWorkspaceAccess] Error:", error);
        return noAccess;
    }
}
