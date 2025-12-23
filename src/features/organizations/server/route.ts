import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import {
    DATABASE_ID,
    ORGANIZATIONS_ID,
    ORGANIZATION_MEMBERS_ID,
    WORKSPACES_ID,
    MEMBERS_ID,
    IMAGES_BUCKET_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { generateInviteCode } from "@/lib/utils";
import { MemberRole } from "@/features/members/types";
import { Organization, OrganizationMember, OrganizationRole } from "../types";
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    addOrganizationMemberSchema,
    updateOrganizationMemberSchema,
    convertToOrganizationSchema,
} from "../schemas";

/**
 * Organizations API Routes
 * 
 * These routes handle organization CRUD, membership management,
 * and PERSONAL → ORG conversion.
 * 
 * INVARIANTS:
 * - Every organization must have ≥1 OWNER
 * - ORG → PERSONAL downgrade is NOT allowed
 * - Conversion is atomic (all or nothing)
 */
const app = new Hono()
    /**
     * GET /organizations
     * List all organizations the current user belongs to
     */
    .get("/", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        // Find all organization memberships for this user
        const memberships = await databases.listDocuments(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [Query.equal("userId", user.$id)]
        );

        if (memberships.total === 0) {
            return c.json({ data: { documents: [], total: 0 } });
        }

        const orgIds = memberships.documents.map((m) => m.organizationId);

        const organizations = await databases.listDocuments<Organization>(
            DATABASE_ID,
            ORGANIZATIONS_ID,
            [Query.contains("$id", orgIds), Query.orderDesc("$createdAt")]
        );

        return c.json({ data: organizations });
    })

    /**
     * GET /organizations/:orgId
     * Get organization details (members only)
     */
    .get("/:orgId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId } = c.req.param();

        // Verify user is a member
        const membership = await getOrganizationMember(databases, orgId, user.$id);
        if (!membership) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const organization = await databases.getDocument<Organization>(
            DATABASE_ID,
            ORGANIZATIONS_ID,
            orgId
        );

        return c.json({ data: organization });
    })

    /**
     * POST /organizations
     * Create a new organization (also creates default workspace)
     */
    .post(
        "/",
        sessionMiddleware,
        zValidator("form", createOrganizationSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { name, image } = c.req.valid("form");

            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image
                );
                const arrayBuffer = await storage.getFilePreview(
                    IMAGES_BUCKET_ID,
                    file.$id
                );
                uploadedImageUrl = `data:image/png;base64,${Buffer.from(
                    arrayBuffer
                ).toString("base64")}`;
            }

            // Create organization
            const organization = await databases.createDocument<Organization>(
                DATABASE_ID,
                ORGANIZATIONS_ID,
                ID.unique(),
                {
                    name,
                    imageUrl: uploadedImageUrl,
                    createdBy: user.$id,
                    billingStartAt: new Date().toISOString(),
                }
            );

            // Add user as OWNER of organization
            await databases.createDocument(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                ID.unique(),
                {
                    organizationId: organization.$id,
                    userId: user.$id,
                    role: OrganizationRole.OWNER,
                    name: user.name,
                    email: user.email,
                }
            );

            // Create default workspace under organization
            const workspace = await databases.createDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                ID.unique(),
                {
                    name: `${name} Workspace`,
                    userId: user.$id,
                    imageUrl: uploadedImageUrl,
                    inviteCode: generateInviteCode(6),
                    organizationId: organization.$id,
                    isDefault: true,
                    billingScope: "organization",
                }
            );

            // Add user as OWNER of workspace
            await databases.createDocument(DATABASE_ID, MEMBERS_ID, ID.unique(), {
                userId: user.$id,
                workspaceId: workspace.$id,
                role: MemberRole.OWNER,
            });

            // Update user prefs to set accountType = ORG
            const account = c.get("account");
            const currentPrefs = user.prefs || {};
            await account.updatePrefs({
                ...currentPrefs,
                accountType: "ORG",
                primaryOrganizationId: organization.$id,
            });

            return c.json({ data: organization });
        }
    )

    /**
     * PATCH /organizations/:orgId
     * Update organization (OWNER or ADMIN only)
     */
    .patch(
        "/:orgId",
        sessionMiddleware,
        zValidator("form", updateOrganizationSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");
            const { orgId } = c.req.param();

            // Verify user has permission
            const membership = await getOrganizationMember(databases, orgId, user.$id);
            if (!membership || membership.role === OrganizationRole.MEMBER) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { name, image, billingSettings } = c.req.valid("form");

            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image
                );
                const arrayBuffer = await storage.getFilePreview(
                    IMAGES_BUCKET_ID,
                    file.$id
                );
                uploadedImageUrl = `data:image/png;base64,${Buffer.from(
                    arrayBuffer
                ).toString("base64")}`;
            }

            const updateData: Record<string, unknown> = {};
            if (name) updateData.name = name;
            if (uploadedImageUrl) updateData.imageUrl = uploadedImageUrl;
            if (billingSettings) updateData.billingSettings = billingSettings;

            const organization = await databases.updateDocument<Organization>(
                DATABASE_ID,
                ORGANIZATIONS_ID,
                orgId,
                updateData
            );

            return c.json({ data: organization });
        }
    )

    /**
     * DELETE /organizations/:orgId
     * Delete organization and all associated data (OWNER only)
     * 
     * CASCADE: Deletes all workspaces, workspace members, and organization members
     * WHY OWNER only: Deletion is irreversible and affects billing
     */
    .delete("/:orgId", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");
        const { orgId } = c.req.param();

        // Verify user is OWNER (not just ADMIN)
        const membership = await getOrganizationMember(databases, orgId, user.$id);
        if (!membership || membership.role !== OrganizationRole.OWNER) {
            return c.json({ error: "Only organization owner can delete" }, 401);
        }

        try {
            // Get all workspaces belonging to this organization
            const workspaces = await databases.listDocuments(
                DATABASE_ID,
                WORKSPACES_ID,
                [Query.equal("organizationId", orgId)]
            );

            // Delete all workspace members for each workspace
            for (const workspace of workspaces.documents) {
                const workspaceMembers = await databases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [Query.equal("workspaceId", workspace.$id)]
                );
                for (const member of workspaceMembers.documents) {
                    await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, member.$id);
                }
                // Delete the workspace itself
                await databases.deleteDocument(DATABASE_ID, WORKSPACES_ID, workspace.$id);
            }

            // Delete all organization members
            const orgMembers = await databases.listDocuments(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [Query.equal("organizationId", orgId)]
            );
            for (const member of orgMembers.documents) {
                await databases.deleteDocument(DATABASE_ID, ORGANIZATION_MEMBERS_ID, member.$id);
            }

            // Delete the organization itself
            await databases.deleteDocument(DATABASE_ID, ORGANIZATIONS_ID, orgId);

            // Update user prefs if this was their primary organization
            const account = c.get("account");
            const currentPrefs = user.prefs || {};
            if (currentPrefs.primaryOrganizationId === orgId) {
                await account.updatePrefs({
                    ...currentPrefs,
                    primaryOrganizationId: null,
                    // Note: We don't downgrade to PERSONAL - that's not allowed
                });
            }

            return c.json({ data: { $id: orgId, deleted: true } });
        } catch (error) {
            console.error("[Organizations] Delete failed:", error);
            return c.json({ error: "Failed to delete organization" }, 500);
        }
    })

    /**
     * GET /organizations/:orgId/members
     * List organization members
     */
    .get("/:orgId/members", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId } = c.req.param();

        // Verify user is a member
        const membership = await getOrganizationMember(databases, orgId, user.$id);
        if (!membership) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const members = await databases.listDocuments<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [Query.equal("organizationId", orgId)]
        );

        return c.json({ data: members });
    })

    /**
     * POST /organizations/:orgId/members
     * Add member to organization (OWNER or ADMIN only)
     */
    .post(
        "/:orgId/members",
        sessionMiddleware,
        zValidator("json", addOrganizationMemberSchema),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { orgId } = c.req.param();

            // Verify user has permission
            const membership = await getOrganizationMember(databases, orgId, user.$id);
            if (!membership || membership.role === OrganizationRole.MEMBER) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { userId, role } = c.req.valid("json");

            // Check if user is already a member
            const existing = await getOrganizationMember(databases, orgId, userId);
            if (existing) {
                return c.json({ error: "User is already a member" }, 400);
            }

            const member = await databases.createDocument(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                ID.unique(),
                {
                    organizationId: orgId,
                    userId,
                    role,
                }
            );

            return c.json({ data: member });
        }
    )

    /**
     * PATCH /organizations/:orgId/members/:userId
     * Update member role (OWNER or ADMIN only)
     */
    .patch(
        "/:orgId/members/:userId",
        sessionMiddleware,
        zValidator("json", updateOrganizationMemberSchema),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { orgId, userId } = c.req.param();

            // Verify user has permission
            const membership = await getOrganizationMember(databases, orgId, user.$id);
            if (!membership || membership.role === OrganizationRole.MEMBER) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { role } = c.req.valid("json");

            // Get target member
            const targetMember = await getOrganizationMember(databases, orgId, userId);
            if (!targetMember) {
                return c.json({ error: "Member not found" }, 404);
            }

            // If changing from OWNER, ensure at least one OWNER remains
            if (targetMember.role === OrganizationRole.OWNER && role !== OrganizationRole.OWNER) {
                const owners = await databases.listDocuments(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    [
                        Query.equal("organizationId", orgId),
                        Query.equal("role", OrganizationRole.OWNER),
                    ]
                );
                if (owners.total <= 1) {
                    return c.json({ error: "Organization must have at least one owner" }, 400);
                }
            }

            const updatedMember = await databases.updateDocument(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                targetMember.$id,
                { role }
            );

            return c.json({ data: updatedMember });
        }
    )

    /**
     * DELETE /organizations/:orgId/members/:userId
     * Remove member from organization (OWNER or ADMIN only)
     */
    .delete("/:orgId/members/:userId", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");
        const { orgId, userId } = c.req.param();

        // Verify user has permission
        const membership = await getOrganizationMember(databases, orgId, user.$id);
        if (!membership || membership.role === OrganizationRole.MEMBER) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        // Get target member
        const targetMember = await getOrganizationMember(databases, orgId, userId);
        if (!targetMember) {
            return c.json({ error: "Member not found" }, 404);
        }

        // If removing an OWNER, ensure at least one OWNER remains
        if (targetMember.role === OrganizationRole.OWNER) {
            const owners = await databases.listDocuments(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [
                    Query.equal("organizationId", orgId),
                    Query.equal("role", OrganizationRole.OWNER),
                ]
            );
            if (owners.total <= 1) {
                return c.json({ error: "Organization must have at least one owner" }, 400);
            }
        }

        await databases.deleteDocument(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            targetMember.$id
        );

        return c.json({ data: { $id: userId } });
    })

    /**
     * POST /organizations/convert
     * Convert PERSONAL account to ORG account (one-way, atomic)
     * 
     * INVARIANTS:
     * - Must be a PERSONAL account
     * - Conversion is irreversible
     * - All workspace IDs preserved
     * - Historical billing stays with user
     * - Future billing moves to organization
     * - Transaction safety with rollback on failure
     */
    .post(
        "/convert",
        sessionMiddleware,
        zValidator("json", convertToOrganizationSchema),
        async (c) => {
            const databases = c.get("databases");
            const account = c.get("account");
            const user = c.get("user");

            const { organizationName } = c.req.valid("json");

            // Check current account type
            const currentPrefs = user.prefs || {};
            if (currentPrefs.accountType === "ORG") {
                return c.json({ error: "Account is already an organization" }, 400);
            }

            // Get user's existing workspaces
            const existingMembers = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                [Query.equal("userId", user.$id)]
            );

            if (existingMembers.total === 0) {
                return c.json({ error: "No workspaces found" }, 400);
            }

            const workspaceIds = existingMembers.documents.map((m) => m.workspaceId);

            // Track created resources for rollback
            const rollbackStack: Array<{ type: string; id: string }> = [];

            try {
                // Step 1: Create organization
                const organization = await databases.createDocument<Organization>(
                    DATABASE_ID,
                    ORGANIZATIONS_ID,
                    ID.unique(),
                    {
                        name: organizationName,
                        createdBy: user.$id,
                        billingStartAt: new Date().toISOString(),
                    }
                );
                rollbackStack.push({ type: "organization", id: organization.$id });

                // Step 2: Add user as OWNER of organization
                const orgMember = await databases.createDocument(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    ID.unique(),
                    {
                        organizationId: organization.$id,
                        userId: user.$id,
                        role: OrganizationRole.OWNER,
                        name: user.name,
                        email: user.email,
                    }
                );
                rollbackStack.push({ type: "orgMember", id: orgMember.$id });

                // Step 3: Update all existing workspaces to belong to organization
                // NOTE: IDs remain unchanged per spec
                for (let i = 0; i < workspaceIds.length; i++) {
                    const wsId = workspaceIds[i];
                    await databases.updateDocument(
                        DATABASE_ID,
                        WORKSPACES_ID,
                        wsId,
                        {
                            organizationId: organization.$id,
                            isDefault: i === 0, // First workspace becomes default
                            billingScope: "organization",
                        }
                    );
                    // Don't add to rollbackStack - workspace updates are reversible
                }

                // Step 4: Ensure user has OWNER role on all workspaces
                // WHY FIX: Do NOT auto-promote ADMIN to OWNER (violates invariant)
                // Only validate/ensure OWNER role for workspaces they already own
                for (const member of existingMembers.documents) {
                    if (member.role !== MemberRole.OWNER) {
                        // If user was ADMIN, they remain ADMIN
                        // Org-level OWNER doesn't automatically grant workspace OWNER
                        continue;
                    }
                    // User already has OWNER - no action needed
                }

                // Step 5: Update user prefs
                await account.updatePrefs({
                    ...currentPrefs,
                    accountType: "ORG",
                    primaryOrganizationId: organization.$id,
                });

                return c.json({
                    data: organization,
                    message: "Successfully converted to organization account",
                });
            } catch (error) {
                // ROLLBACK: Clean up in reverse order
                console.error("[Organizations] Conversion failed, rolling back:", error);

                for (const item of rollbackStack.reverse()) {
                    try {
                        if (item.type === "organization") {
                            await databases.deleteDocument(DATABASE_ID, ORGANIZATIONS_ID, item.id);
                        } else if (item.type === "orgMember") {
                            await databases.deleteDocument(DATABASE_ID, ORGANIZATION_MEMBERS_ID, item.id);
                        }
                    } catch (rollbackError) {
                        console.error(`[Organizations] Rollback failed for ${item.type}:`, rollbackError);
                    }
                }

                // Revert workspace updates (if any succeeded)
                for (const wsId of workspaceIds) {
                    try {
                        await databases.updateDocument(
                            DATABASE_ID,
                            WORKSPACES_ID,
                            wsId,
                            {
                                organizationId: null,
                                isDefault: false,
                                billingScope: "user",
                            }
                        );
                    } catch (revertError) {
                        console.error("[Organizations] Workspace revert failed:", revertError);
                    }
                }

                return c.json({
                    error: "Conversion failed. Your account has been reverted to PERSONAL."
                }, 500);
            }
        }
    );

/**
 * Helper: Get organization member
 */
async function getOrganizationMember(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    databases: any,
    organizationId: string,
    userId: string
): Promise<OrganizationMember | null> {
    const members = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        [
            Query.equal("organizationId", organizationId),
            Query.equal("userId", userId),
        ]
    );
    return members.documents[0] || null;
}

export default app;
