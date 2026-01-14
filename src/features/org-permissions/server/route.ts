import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import {
    DATABASE_ID,
    ORG_MEMBER_PERMISSIONS_ID,
    ORGANIZATION_MEMBERS_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { OrganizationMember, OrganizationRole, OrgMemberStatus } from "@/features/organizations/types";
import { OrgMemberPermission, OrgPermissionKey } from "../types";
import {
    grantPermissionSchema,
    revokePermissionSchema,
    bulkGrantPermissionsSchema,
} from "../schemas";

/**
 * Org Permissions API Routes
 * 
 * RULES:
 * - Only OWNER can manage permissions
 * - Permissions are explicit grants (not inferred)
 * - OWNER implicitly has all permissions (not stored in DB)
 */
const app = new Hono()
    /**
     * GET /permissions/:orgId/member/:orgMemberId
     * Get all permissions for a specific org member
     */
    .get("/:orgId/member/:orgMemberId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId, orgMemberId } = c.req.param();

        // Verify user is active org member
        const membership = await databases.listDocuments<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", orgId),
                Query.equal("userId", user.$id),
                Query.equal("status", OrgMemberStatus.ACTIVE),
            ]
        );

        if (membership.total === 0) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        // Get target member
        const targetMember = await databases.getDocument<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            orgMemberId
        );

        if (targetMember.organizationId !== orgId) {
            return c.json({ error: "Member not found" }, 404);
        }

        // OWNER has all permissions implicitly
        if (targetMember.role === OrganizationRole.OWNER) {
            return c.json({
                data: {
                    memberId: orgMemberId,
                    permissions: Object.values(OrgPermissionKey),
                    isOwner: true,
                },
            });
        }

        // Get explicit permissions
        const permissions = await databases.listDocuments<OrgMemberPermission>(
            DATABASE_ID,
            ORG_MEMBER_PERMISSIONS_ID,
            [Query.equal("orgMemberId", orgMemberId)]
        );

        return c.json({
            data: {
                memberId: orgMemberId,
                permissions: permissions.documents.map((p) => p.permissionKey),
                isOwner: false,
            },
        });
    })

    /**
     * GET /permissions/:orgId/all
     * Get all member permissions in org (for admins)
     */
    .get("/:orgId/all", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId } = c.req.param();

        // Verify user is OWNER or ADMIN
        const membership = await databases.listDocuments<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", orgId),
                Query.equal("userId", user.$id),
                Query.equal("status", OrgMemberStatus.ACTIVE),
            ]
        );

        if (membership.total === 0) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const role = membership.documents[0].role as OrganizationRole;
        if (role !== OrganizationRole.OWNER && role !== OrganizationRole.ADMIN) {
            return c.json({ error: "Forbidden - requires OWNER or ADMIN" }, 403);
        }

        // Get all org members
        const members = await databases.listDocuments<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", orgId),
                Query.equal("status", OrgMemberStatus.ACTIVE),
                Query.limit(100),
            ]
        );

        // Get all permissions in org
        const memberIds = members.documents.map((m) => m.$id);
        const allPermissions = memberIds.length > 0
            ? await databases.listDocuments<OrgMemberPermission>(
                DATABASE_ID,
                ORG_MEMBER_PERMISSIONS_ID,
                [Query.contains("orgMemberId", memberIds), Query.limit(1000)]
            )
            : { documents: [] };

        // Group permissions by member
        const permissionsByMember: Record<string, string[]> = {};
        for (const perm of allPermissions.documents) {
            if (!permissionsByMember[perm.orgMemberId]) {
                permissionsByMember[perm.orgMemberId] = [];
            }
            permissionsByMember[perm.orgMemberId].push(perm.permissionKey);
        }

        // Build response
        const data = members.documents.map((m) => ({
            memberId: m.$id,
            name: m.name || m.email,
            email: m.email,
            role: m.role,
            isOwner: m.role === OrganizationRole.OWNER,
            permissions:
                m.role === OrganizationRole.OWNER
                    ? Object.values(OrgPermissionKey)
                    : permissionsByMember[m.$id] || [],
        }));

        return c.json({ data });
    })

    /**
     * POST /permissions/:orgId/grant
     * Grant a permission to a member
     */
    .post(
        "/:orgId/grant",
        sessionMiddleware,
        zValidator("json", grantPermissionSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { orgId } = c.req.param();
            const { orgMemberId, permissionKey } = c.req.valid("json");

            // Verify user is OWNER
            const membership = await databases.listDocuments<OrganizationMember>(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [
                    Query.equal("organizationId", orgId),
                    Query.equal("userId", user.$id),
                    Query.equal("status", OrgMemberStatus.ACTIVE),
                ]
            );

            if (membership.total === 0) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const role = membership.documents[0].role as OrganizationRole;
            if (role !== OrganizationRole.OWNER) {
                return c.json({ error: "Forbidden - only OWNER can grant permissions" }, 403);
            }

            // Verify target member exists and belongs to org
            const targetMember = await databases.getDocument<OrganizationMember>(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                orgMemberId
            );

            if (targetMember.organizationId !== orgId) {
                return c.json({ error: "Member not found" }, 404);
            }

            // Cannot grant permissions to OWNER (they have all)
            if (targetMember.role === OrganizationRole.OWNER) {
                return c.json({ error: "OWNER already has all permissions" }, 400);
            }

            // Check if permission already exists
            const existing = await databases.listDocuments(
                DATABASE_ID,
                ORG_MEMBER_PERMISSIONS_ID,
                [
                    Query.equal("orgMemberId", orgMemberId),
                    Query.equal("permissionKey", permissionKey),
                ]
            );

            if (existing.total > 0) {
                return c.json({ error: "Permission already granted" }, 400);
            }

            // Grant permission
            const permission = await databases.createDocument<OrgMemberPermission>(
                DATABASE_ID,
                ORG_MEMBER_PERMISSIONS_ID,
                ID.unique(),
                {
                    orgMemberId,
                    permissionKey,
                    grantedBy: user.$id,
                    grantedAt: new Date().toISOString(),
                }
            );

            return c.json({ data: permission }, 201);
        }
    )

    /**
     * POST /permissions/:orgId/bulk-grant
     * Grant multiple permissions at once
     */
    .post(
        "/:orgId/bulk-grant",
        sessionMiddleware,
        zValidator("json", bulkGrantPermissionsSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { orgId } = c.req.param();
            const { orgMemberId, permissionKeys } = c.req.valid("json");

            // Verify user is OWNER
            const membership = await databases.listDocuments<OrganizationMember>(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [
                    Query.equal("organizationId", orgId),
                    Query.equal("userId", user.$id),
                    Query.equal("status", OrgMemberStatus.ACTIVE),
                ]
            );

            if (membership.total === 0) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const role = membership.documents[0].role as OrganizationRole;
            if (role !== OrganizationRole.OWNER) {
                return c.json({ error: "Forbidden - only OWNER can grant permissions" }, 403);
            }

            // Verify target member
            const targetMember = await databases.getDocument<OrganizationMember>(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                orgMemberId
            );

            if (targetMember.organizationId !== orgId) {
                return c.json({ error: "Member not found" }, 404);
            }

            if (targetMember.role === OrganizationRole.OWNER) {
                return c.json({ error: "OWNER already has all permissions" }, 400);
            }

            // Get existing permissions
            const existing = await databases.listDocuments<OrgMemberPermission>(
                DATABASE_ID,
                ORG_MEMBER_PERMISSIONS_ID,
                [Query.equal("orgMemberId", orgMemberId)]
            );

            const existingKeys = new Set(existing.documents.map((p) => p.permissionKey));

            // Only add permissions that don't exist
            const toGrant = permissionKeys.filter((k) => !existingKeys.has(k));

            const granted = await Promise.all(
                toGrant.map((key) =>
                    databases.createDocument<OrgMemberPermission>(
                        DATABASE_ID,
                        ORG_MEMBER_PERMISSIONS_ID,
                        ID.unique(),
                        {
                            orgMemberId,
                            permissionKey: key,
                            grantedBy: user.$id,
                            grantedAt: new Date().toISOString(),
                        }
                    )
                )
            );

            return c.json({
                data: {
                    granted: granted.length,
                    skipped: permissionKeys.length - granted.length,
                    permissions: [...existingKeys, ...toGrant],
                },
            }, 201);
        }
    )

    /**
     * DELETE /permissions/:orgId/revoke
     * Revoke a permission from a member
     */
    .post(
        "/:orgId/revoke",
        sessionMiddleware,
        zValidator("json", revokePermissionSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { orgId } = c.req.param();
            const { orgMemberId, permissionKey } = c.req.valid("json");

            // Verify user is OWNER
            const membership = await databases.listDocuments<OrganizationMember>(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [
                    Query.equal("organizationId", orgId),
                    Query.equal("userId", user.$id),
                    Query.equal("status", OrgMemberStatus.ACTIVE),
                ]
            );

            if (membership.total === 0) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const role = membership.documents[0].role as OrganizationRole;
            if (role !== OrganizationRole.OWNER) {
                return c.json({ error: "Forbidden - only OWNER can revoke permissions" }, 403);
            }

            // Find permission
            const existing = await databases.listDocuments<OrgMemberPermission>(
                DATABASE_ID,
                ORG_MEMBER_PERMISSIONS_ID,
                [
                    Query.equal("orgMemberId", orgMemberId),
                    Query.equal("permissionKey", permissionKey),
                ]
            );

            if (existing.total === 0) {
                return c.json({ error: "Permission not found" }, 404);
            }

            // Revoke
            await databases.deleteDocument(
                DATABASE_ID,
                ORG_MEMBER_PERMISSIONS_ID,
                existing.documents[0].$id
            );

            return c.json({ success: true });
        }
    );

export default app;
