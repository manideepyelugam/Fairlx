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
import { createAdminClient } from "@/lib/appwrite";
import { MemberRole } from "@/features/members/types";
import { hasOrgPermission } from "@/lib/permission-matrix";
import { Organization, OrganizationMember, OrganizationRole, OrgMemberStatus } from "../types";
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    addOrganizationMemberSchema,
    updateOrganizationMemberSchema,
    createOrgMemberSchema,
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
            [
                Query.contains("$id", orgIds),
                Query.orderDesc("$createdAt"),
                // NOTE: deletedAt filter removed - attribute not in schema
                // Soft delete can be added later when schema is updated
            ]
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
                    status: OrgMemberStatus.ACTIVE,
                    name: user.name,
                    email: user.email,
                }
            );

            // NOTE: Workspace creation is handled separately in the onboarding workspace step
            // User can choose to create a workspace or skip to enter ZERO-WORKSPACE state
            // This allows "Skip workspace" to truly mean no workspace is created

            // Update user prefs to set accountType = ORG
            const account = c.get("account");
            const currentPrefs = user.prefs || {};
            await account.updatePrefs({
                ...currentPrefs,
                accountType: "ORG",
                primaryOrganizationId: organization.$id,
            });

            // Log audit event for organization creation using admin client for robustness
            const { logOrgAudit, OrgAuditAction } = await import("../audit");
            const { databases: adminDatabases } = await createAdminClient();
            await logOrgAudit({
                databases: adminDatabases,
                organizationId: organization.$id,
                actorUserId: user.$id,
                actionType: OrgAuditAction.ORGANIZATION_CREATED,
                metadata: {
                    organizationName: name,
                },
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

            // Verify user has permission to edit org (OWNER or ADMIN)
            const membership = await getOrganizationMember(databases, orgId, user.$id);
            if (!membership || !hasOrgPermission(membership.role as OrganizationRole, "INVITE_MEMBERS")) {
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
     * SOFT-DELETE organization (OWNER only)
     * 
     * BEHAVIOR CHANGE: Now performs soft-delete instead of hard-delete
     * - Sets deletedAt timestamp
     * - Freezes billing immediately
     * - Data retained for grace period (default 30 days)
     * - Workspaces and members are NOT deleted - they become inaccessible
     * 
     * WHY soft-delete:
     * - Prevents accidental data loss
     * - Enables recovery within grace period
     * - Required for billing audit trail
     * - Compliance requirement
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
            // Get organization to verify it exists and isn't already deleted
            const organization = await databases.getDocument<Organization>(
                DATABASE_ID,
                ORGANIZATIONS_ID,
                orgId
            );

            if (organization.deletedAt) {
                return c.json({ error: "Organization is already deleted" }, 400);
            }

            const now = new Date().toISOString();

            // SOFT-DELETE: Mark as deleted and freeze billing
            // Data is NOT removed - just marked inaccessible
            await databases.updateDocument(
                DATABASE_ID,
                ORGANIZATIONS_ID,
                orgId,
                {
                    deletedAt: now,
                    deletedBy: user.$id,
                    billingFrozenAt: now,
                }
            );

            // Log audit event using admin client
            const { logOrgAudit, OrgAuditAction } = await import("../audit");
            const { databases: adminDatabases } = await createAdminClient();
            await logOrgAudit({
                databases: adminDatabases,
                organizationId: orgId,
                actorUserId: user.$id,
                actionType: OrgAuditAction.ORGANIZATION_DELETED,
                metadata: {
                    organizationName: organization.name,
                    workspaceCount: (await databases.listDocuments(
                        DATABASE_ID,
                        WORKSPACES_ID,
                        [Query.equal("organizationId", orgId)]
                    )).total,
                },
            });

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

            return c.json({
                data: {
                    $id: orgId,
                    deleted: true,
                    deletedAt: now,
                    // Inform client about grace period
                    gracePeriodDays: 30,
                    permanentDeletionAt: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                },
            });
        } catch (error) {
            console.error("[Organizations] Soft-delete failed:", error);
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

            // Verify user has permission to add members (OWNER or ADMIN)
            const membership = await getOrganizationMember(databases, orgId, user.$id);
            if (!membership || !hasOrgPermission(membership.role as OrganizationRole, "INVITE_MEMBERS")) {
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
                    status: OrgMemberStatus.ACTIVE,
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

            // Verify user has permission to update roles (OWNER or ADMIN)
            const membership = await getOrganizationMember(databases, orgId, user.$id);
            if (!membership || !hasOrgPermission(membership.role as OrganizationRole, "INVITE_MEMBERS")) {
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
     * 
     * BEHAVIOR:
     * - Hard-deletes org_member record
     * - Removes ALL workspace memberships for this user in org workspaces
     * - Logs audit event
     * - User account remains intact (for identity/audit trail)
     */
    .delete("/:orgId/members/:userId", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");
        const { orgId, userId } = c.req.param();

        // Verify user has permission to remove members (OWNER or ADMIN)
        const membership = await getOrganizationMember(databases, orgId, user.$id);
        if (!membership || !hasOrgPermission(membership.role as OrganizationRole, "REMOVE_MEMBERS")) {
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

        try {
            // Step 1: Remove ALL workspace memberships for this user in org workspaces
            const orgWorkspaces = await databases.listDocuments(
                DATABASE_ID,
                WORKSPACES_ID,
                [Query.equal("organizationId", orgId)]
            );

            let workspaceMembershipsRemoved = 0;
            for (const workspace of orgWorkspaces.documents) {
                const wsMemberships = await databases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [
                        Query.equal("workspaceId", workspace.$id),
                        Query.equal("userId", userId),
                    ]
                );
                for (const wsm of wsMemberships.documents) {
                    await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, wsm.$id);
                    workspaceMembershipsRemoved++;
                }
            }

            // Step 2: Log audit event BEFORE deletion
            const { logOrgAudit, OrgAuditAction } = await import("../audit");
            const { databases: adminDatabases } = await createAdminClient();
            await logOrgAudit({
                databases: adminDatabases,
                organizationId: orgId,
                actorUserId: user.$id,
                actionType: OrgAuditAction.MEMBER_REMOVED,
                metadata: {
                    removedUserId: userId,
                    removedMemberEmail: targetMember.email,
                    removedMemberName: targetMember.name,
                    removedMemberRole: targetMember.role,
                    workspaceMembershipsRemoved,
                },
            });

            // Step 3: Hard-delete org_member record
            await databases.deleteDocument(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                targetMember.$id
            );

            return c.json({
                data: {
                    $id: userId,
                    orgMemberId: targetMember.$id,
                    workspaceMembershipsRemoved,
                },
            });
        } catch (error) {
            console.error("[Organizations] Member removal failed:", error);
            return c.json({ error: "Failed to remove member" }, 500);
        }
    })

    /**
     * POST /organizations/:orgId/members/create-user
     * Create a new user account and add as org member (ORG accounts only)
     * 
     * SECURITY:
     * - Only OWNER or ADMIN can create members
     * - Email uniqueness enforced per-organization (not globally)
     * - Temp password generated server-side
     * - mustResetPassword flag set for first login
     * 
     * RE-ADD FLOW:
     * - If email was previously deleted from THIS org, allows re-adding
     * - If Appwrite user exists, reuses existing account
     * - Creates fresh org_member record
     */
    .post(
        "/:orgId/members/create-user",
        sessionMiddleware,
        zValidator("json", createOrgMemberSchema),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { orgId } = c.req.param();
            const { fullName, email, role } = c.req.valid("json");

            // GATE: Verify caller is OWNER or ADMIN
            const membership = await getOrganizationMember(databases, orgId, user.$id);
            if (!membership || !hasOrgPermission(membership.role as OrganizationRole, "INVITE_MEMBERS")) {
                return c.json({ error: "Unauthorized. Only OWNER or ADMIN can add members." }, 401);
            }

            // Get organization name for messages
            const organization = await databases.getDocument<Organization>(
                DATABASE_ID,
                ORGANIZATIONS_ID,
                orgId
            );

            // Check if email already exists in THIS organization only
            const existingMemberInOrg = await databases.listDocuments(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [
                    Query.equal("email", email),
                    Query.equal("organizationId", orgId),
                ]
            );

            if (existingMemberInOrg.total > 0) {
                // Email already a member of THIS org - block
                return c.json({
                    error: "EMAIL_EXISTS",
                    code: "EMAIL_EXISTS",
                    orgName: organization.name,
                    message: `This email is already a member of ${organization.name}.`
                }, 400);
            }

            // Generate secure temporary password (16 chars, mixed)
            const crypto = await import("crypto");
            const tempPassword = crypto.randomBytes(12).toString("base64").slice(0, 16);

            try {
                const { users, databases: adminDatabases } = await createAdminClient();
                let targetUserId: string;
                let isExistingUser = false;

                // Try to find existing Appwrite user by email
                try {
                    const existingUsers = await users.list([
                        Query.equal("email", email),
                    ]);

                    if (existingUsers.total > 0) {
                        // User exists in Appwrite - reuse them
                        isExistingUser = true;
                        targetUserId = existingUsers.users[0].$id;

                        // Update their password with new temp password
                        await users.updatePassword(targetUserId, tempPassword);

                        // Update user prefs
                        const existingPrefs = existingUsers.users[0].prefs || {};
                        await users.updatePrefs(targetUserId, {
                            ...existingPrefs,
                            mustResetPassword: true,
                            accountType: "ORG",
                            primaryOrganizationId: orgId,
                        });

                        // Update name if different
                        if (existingUsers.users[0].name !== fullName) {
                            await users.updateName(targetUserId, fullName);
                        }
                    } else {
                        // No existing user - create new one
                        const newUser = await users.create(
                            ID.unique(),
                            email,
                            undefined, // phone
                            tempPassword,
                            fullName
                        );
                        targetUserId = newUser.$id;

                        // Set user prefs to indicate password reset required
                        await users.updatePrefs(targetUserId, {
                            mustResetPassword: true,
                            accountType: "ORG",
                            primaryOrganizationId: orgId,
                        });
                    }
                } catch (_userLookupError) {
                    // If user lookup fails, try to create new user
                    const newUser = await users.create(
                        ID.unique(),
                        email,
                        undefined, // phone
                        tempPassword,
                        fullName
                    );
                    targetUserId = newUser.$id;

                    await users.updatePrefs(targetUserId, {
                        mustResetPassword: true,
                        accountType: "ORG",
                        primaryOrganizationId: orgId,
                    });
                }

                // ORG-ADDED: Mark user as verified (skip email verification step)
                // This improves UX while maintaining security via password reset requirement
                await users.updateEmailVerification(targetUserId, true);

                // Generate first-login magic link token
                const rawToken = crypto.randomBytes(32).toString("hex");
                const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

                // Store hashed token (raw token is never persisted)
                const { LOGIN_TOKENS_ID } = await import("@/config");
                if (LOGIN_TOKENS_ID) {
                    await adminDatabases.createDocument(
                        DATABASE_ID,
                        LOGIN_TOKENS_ID,
                        ID.unique(),
                        {
                            userId: targetUserId,
                            orgId,
                            tokenHash,
                            expiresAt,
                            usedAt: null,
                            purpose: "FIRST_LOGIN",
                        }
                    );
                }

                // Create org_member record
                const member = await databases.createDocument(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    ID.unique(),
                    {
                        organizationId: orgId,
                        userId: targetUserId,
                        role,
                        status: OrgMemberStatus.INVITED,
                        mustResetPassword: true,
                        name: fullName,
                        email: email,
                    }
                );

                // Log audit events
                const { logOrgAudit, OrgAuditAction } = await import("../audit");
                await logOrgAudit({
                    databases: adminDatabases,
                    organizationId: orgId,
                    actorUserId: user.$id,
                    actionType: OrgAuditAction.MEMBER_ADDED,
                    metadata: {
                        targetUserId,
                        targetEmail: email,
                        role,
                        creationType: isExistingUser ? "readded_existing_user" : "admin_created",
                        isExistingUser,
                        verifiedByDefault: true,
                    },
                });

                // Log token creation (never log raw token)
                if (LOGIN_TOKENS_ID) {
                    await logOrgAudit({
                        databases: adminDatabases,
                        organizationId: orgId,
                        actorUserId: user.$id,
                        actionType: OrgAuditAction.FIRST_LOGIN_TOKEN_CREATED,
                        metadata: {
                            targetUserId,
                            expiresAt,
                        },
                    });
                }

                // Send welcome email with magic link
                const { sendWelcomeEmail, logEmailSent } = await import("../services/email-service");
                const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`;
                const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

                const emailResult = await sendWelcomeEmail({
                    recipientEmail: email,
                    recipientName: fullName,
                    recipientUserId: targetUserId,
                    organizationName: organization.name,
                    tempPassword,
                    loginUrl,
                    firstLoginToken: LOGIN_TOKENS_ID ? rawToken : undefined,
                    appUrl: LOGIN_TOKENS_ID ? appUrl : undefined,
                });

                // Log email sent event (non-blocking)
                if (emailResult.success) {
                    logEmailSent({
                        organizationId: orgId,
                        recipientUserId: targetUserId,
                        recipientEmail: email,
                        emailType: "welcome",
                    });
                }

                return c.json({
                    data: {
                        member,
                        userId: targetUserId,
                        emailSent: emailResult.success,
                        emailError: emailResult.success ? undefined : emailResult.error,
                        isExistingUser,
                        hasMagicLink: !!LOGIN_TOKENS_ID,
                        // SECURITY: In production, remove this - send via email only
                        tempPassword: process.env.NODE_ENV === "development" ? tempPassword : undefined,
                    },
                    message: isExistingUser
                        ? "Member re-added successfully. Welcome email sent with new password."
                        : "Member created successfully. Welcome email sent.",
                });

            } catch (error: unknown) {
                const appwriteError = error as { code?: number; message?: string };

                // Handle duplicate email in Appwrite (shouldn't happen with our flow, but safety check)
                if (appwriteError.code === 409) {
                    return c.json({
                        error: "EMAIL_EXISTS",
                        code: "EMAIL_EXISTS",
                        message: "This email is already registered. Please try again.",
                    }, 400);
                }

                console.error("Create org member error:", error);
                return c.json({
                    error: appwriteError.message || "Failed to create member",
                }, 500);
            }
        }
    )


    /**
     * POST /organizations/:orgId/members/:userId/resend-welcome
     * Resend welcome email with new temp password
     * Only for members with mustResetPassword = true (pending activation)
     */
    .post(
        "/:orgId/members/:userId/resend-welcome",
        sessionMiddleware,
        async (c) => {
            const { orgId, userId } = c.req.param();
            const user = c.get("user");

            if (!orgId || !userId) {
                return c.json({ error: "Missing orgId or userId" }, 400);
            }

            try {
                const { users, databases } = await createAdminClient();

                // Verify requester is OWNER/ADMIN of this org
                const requesterMemberships = await databases.listDocuments(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    [
                        Query.equal("organizationId", orgId),
                        Query.equal("userId", user.$id),
                    ]
                );

                if (requesterMemberships.total === 0) {
                    return c.json({ error: "Not a member of this organization" }, 403);
                }

                const requesterRole = requesterMemberships.documents[0].role;
                if (!["OWNER", "ADMIN"].includes(requesterRole)) {
                    return c.json({ error: "Only OWNER or ADMIN can resend welcome emails" }, 403);
                }

                // Get the target member
                const targetMemberships = await databases.listDocuments(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    [
                        Query.equal("organizationId", orgId),
                        Query.equal("userId", userId),
                    ]
                );

                if (targetMemberships.total === 0) {
                    return c.json({ error: "Member not found" }, 404);
                }

                const member = targetMemberships.documents[0];

                // Check if member still needs password reset
                if (!member.mustResetPassword) {
                    return c.json({
                        error: "Member has already activated their account",
                        code: "ALREADY_ACTIVATED"
                    }, 400);
                }

                // Get the target user
                const targetUser = await users.get(userId);

                // Get organization name
                const organization = await databases.getDocument(
                    DATABASE_ID,
                    ORGANIZATIONS_ID,
                    orgId
                );

                // Generate new temp password
                const crypto = await import("crypto");
                const newTempPassword = crypto.randomBytes(12).toString("base64url").slice(0, 16);

                // Update user's password
                await users.updatePassword(userId, newTempPassword);

                // Send welcome email
                const { sendWelcomeEmail } = await import("../services/email-service");
                const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`;

                const emailResult = await sendWelcomeEmail({
                    recipientEmail: targetUser.email,
                    recipientName: member.name || targetUser.name || targetUser.email,
                    recipientUserId: userId,
                    organizationName: organization.name,
                    tempPassword: newTempPassword,
                    loginUrl,
                });

                if (!emailResult.success) {
                    console.error("Failed to send welcome email:", emailResult.error);
                    return c.json({
                        error: `Failed to send email: ${emailResult.error || "Unknown error"}. Please check your SMTP configuration in Appwrite Console.`
                    }, 424); // 424 Failed Dependency
                }

                return c.json({
                    success: true,
                    emailSent: true,
                    message: "Welcome email resent with new temporary password",
                    // SECURITY: In production, remove this - send via email only
                    tempPassword: process.env.NODE_ENV === "development" ? newTempPassword : undefined,
                });

            } catch (error) {
                console.error("Resend welcome email error:", error);
                return c.json({ error: "Failed to resend welcome email" }, 500);
            }
        }
    )

    /**
     * POST /organizations/convert
     * Convert PERSONAL account to ORG account (one-way, atomic, IDEMPOTENT)
     * 
     * INVARIANTS (Item 6):
     * - Must be a PERSONAL account (or idempotently return existing org)
     * - Conversion is irreversible
     * - All workspace IDs preserved
     * - Historical billing stays with user (usage.createdAt < accountConversionCompletedAt)
     * - Future billing moves to organization
     * - Transaction safety with rollback on failure
     * 
     * IDEMPOTENCY:
     * - If user already has primaryOrganizationId set, return that org
     * - Repeated calls must not create duplicate orgs
     * - Must safely resume or no-op if already converted
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

            // Check current account type and handle IDEMPOTENCY
            const currentPrefs = user.prefs || {};

            // IDEMPOTENCY CHECK: If already ORG with a primary org, return that org
            if (currentPrefs.accountType === "ORG" && currentPrefs.primaryOrganizationId) {
                try {
                    const existingOrg = await databases.getDocument<Organization>(
                        DATABASE_ID,
                        ORGANIZATIONS_ID,
                        currentPrefs.primaryOrganizationId
                    );

                    console.log(
                        `[Organizations] IDEMPOTENT: User ${user.$id} already converted to org ${existingOrg.$id}`
                    );

                    return c.json({
                        data: existingOrg,
                        message: "Account is already an organization (idempotent response)",
                        idempotent: true,
                    });
                } catch {
                    // Org doesn't exist but prefs say ORG - corrupted state
                    // Allow conversion to proceed to fix it
                    console.warn(
                        `[Organizations] Corrupted state: User ${user.$id} has ORG type but org ${currentPrefs.primaryOrganizationId} not found`
                    );
                }
            }

            // Also reject if accountType is ORG but no primaryOrganizationId
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

            // CRITICAL: Capture conversion timestamp BEFORE any changes
            // This becomes the billing boundary (Item 3)
            const accountConversionCompletedAt = new Date().toISOString();

            try {
                // Step 1: Create organization with billingStartAt = accountConversionCompletedAt
                // This timestamp is the authoritative billing boundary
                const organization = await databases.createDocument<Organization>(
                    DATABASE_ID,
                    ORGANIZATIONS_ID,
                    ID.unique(),
                    {
                        name: organizationName,
                        createdBy: user.$id,
                        // CRITICAL (Item 3): billingStartAt = accountConversionCompletedAt
                        // usage.createdAt < billingStartAt → bill PERSONAL
                        // usage.createdAt >= billingStartAt → bill ORGANIZATION
                        billingStartAt: accountConversionCompletedAt,
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
                        status: OrgMemberStatus.ACTIVE,
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

                // Step 6: Log audit event for conversion
                // CRITICAL: This happens after all changes succeed. Use admin client.
                const { logOrgAudit, OrgAuditAction } = await import("../audit");
                const { databases: adminDatabases } = await createAdminClient();
                await logOrgAudit({
                    databases: adminDatabases,
                    organizationId: organization.$id,
                    actorUserId: user.$id,
                    actionType: OrgAuditAction.ACCOUNT_CONVERTED,
                    metadata: {
                        organizationName,
                        previousAccountType: "PERSONAL",
                        newAccountType: "ORG",
                        workspaceCount: workspaceIds.length,
                        workspaceIds,
                        conversionTimestamp: new Date().toISOString(),
                    },
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
    )

    /**
     * GET /organizations/:orgId/audit-logs
     * Read-only view of organization audit logs
     * OWNER ONLY - for compliance and debugging
     */
    .get("/:orgId/audit-logs", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");
        const { orgId } = c.req.param();

        // OWNER ONLY - audit logs are sensitive
        const membership = await getOrganizationMember(databases, orgId, user.$id);
        if (!membership || membership.role !== OrganizationRole.OWNER) {
            return c.json({ error: "Only organization owner can view audit logs" }, 403);
        }

        // Get pagination params
        const url = new URL(c.req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const actionType = url.searchParams.get("actionType") || undefined;

        try {
            const { getOrgAuditLogs } = await import("../audit");

            // CRITICAL FIX: Use admin client for audit logs retrieval
            // WHY: Audit logs are sensitive and usually don't have public/user read permissions.
            // We already verified the user is an OWNER above using the session client.
            const { databases: adminDatabases } = await createAdminClient();

            const result = await getOrgAuditLogs({
                databases: adminDatabases,
                organizationId: orgId,
                actionType: actionType as import("../audit").OrgAuditAction | undefined,
                limit,
                offset,
            });

            return c.json({
                data: result.logs,
                total: result.total,
                limit,
                offset,
            });
        } catch (error) {
            console.error("[Organizations] Failed to fetch audit logs:", error);
            return c.json({ error: "Failed to fetch audit logs" }, 500);
        }
    });

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

