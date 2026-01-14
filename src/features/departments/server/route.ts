import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import {
    DATABASE_ID,
    DEPARTMENTS_ID,
    ORG_MEMBER_DEPARTMENTS_ID,
    ORGANIZATION_MEMBERS_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { hasOrgPermission } from "@/lib/permission-matrix";
import { OrganizationMember, OrganizationRole, OrgMemberStatus } from "@/features/organizations/types";
import { Department, OrgMemberDepartment, PopulatedDepartment } from "../types";
import {
    createDepartmentSchema,
    updateDepartmentSchema,
    assignMemberToDepartmentSchema,
} from "../schemas";

/**
 * Departments API Routes
 * 
 * RULES:
 * - Departments belong to organizations (org-level)
 * - Only OWNER/ADMIN can manage departments (MANAGE_DEPARTMENTS permission)
 * - Departments do NOT grant permissions
 * - Departments are metadata for grouping/analytics
 */
const app = new Hono()
    /**
     * GET /organizations/:orgId/departments
     * List all departments in an organization
     */
    .get("/:orgId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId } = c.req.param();

        // Verify user is org member
        const memberships = await databases.listDocuments<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", orgId),
                Query.equal("userId", user.$id),
                Query.equal("status", OrgMemberStatus.ACTIVE),
            ]
        );

        if (memberships.total === 0) {
            return c.json({ error: "Unauthorized - not an org member" }, 401);
        }

        // Get all departments
        const departments = await databases.listDocuments<Department>(
            DATABASE_ID,
            DEPARTMENTS_ID,
            [
                Query.equal("organizationId", orgId),
                Query.orderAsc("name"),
            ]
        );

        // Count members per department
        const populatedDepartments: PopulatedDepartment[] = await Promise.all(
            departments.documents.map(async (dept) => {
                const memberAssignments = await databases.listDocuments(
                    DATABASE_ID,
                    ORG_MEMBER_DEPARTMENTS_ID,
                    [Query.equal("departmentId", dept.$id)]
                );
                return {
                    ...dept,
                    memberCount: memberAssignments.total,
                };
            })
        );

        return c.json({ data: { documents: populatedDepartments, total: departments.total } });
    })

    /**
     * POST /organizations/:orgId/departments
     * Create a new department
     */
    .post(
        "/:orgId",
        sessionMiddleware,
        zValidator("json", createDepartmentSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { orgId } = c.req.param();
            const { name, description, color } = c.req.valid("json");

            // Verify permission
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
            if (!hasOrgPermission(role, "MANAGE_DEPARTMENTS")) {
                return c.json({ error: "Forbidden - requires MANAGE_DEPARTMENTS permission" }, 403);
            }

            // Check for duplicate name
            const existing = await databases.listDocuments(
                DATABASE_ID,
                DEPARTMENTS_ID,
                [
                    Query.equal("organizationId", orgId),
                    Query.equal("name", name),
                ]
            );

            if (existing.total > 0) {
                return c.json({ error: "Department with this name already exists" }, 400);
            }

            const department = await databases.createDocument<Department>(
                DATABASE_ID,
                DEPARTMENTS_ID,
                ID.unique(),
                {
                    organizationId: orgId,
                    name,
                    description: description || null,
                    color: color || "#4F46E5",
                    createdBy: user.$id,
                }
            );

            return c.json({ data: department }, 201);
        }
    )

    /**
     * PATCH /organizations/:orgId/departments/:departmentId
     * Update a department
     */
    .patch(
        "/:orgId/:departmentId",
        sessionMiddleware,
        zValidator("json", updateDepartmentSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { orgId, departmentId } = c.req.param();
            const updates = c.req.valid("json");

            // Verify permission
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
            if (!hasOrgPermission(role, "MANAGE_DEPARTMENTS")) {
                return c.json({ error: "Forbidden - requires MANAGE_DEPARTMENTS permission" }, 403);
            }

            // Verify department exists and belongs to org
            const department = await databases.getDocument<Department>(
                DATABASE_ID,
                DEPARTMENTS_ID,
                departmentId
            );

            if (department.organizationId !== orgId) {
                return c.json({ error: "Department not found in this organization" }, 404);
            }

            // Check for duplicate name if updating name
            if (updates.name && updates.name !== department.name) {
                const existing = await databases.listDocuments(
                    DATABASE_ID,
                    DEPARTMENTS_ID,
                    [
                        Query.equal("organizationId", orgId),
                        Query.equal("name", updates.name),
                    ]
                );

                if (existing.total > 0) {
                    return c.json({ error: "Department with this name already exists" }, 400);
                }
            }

            const updated = await databases.updateDocument<Department>(
                DATABASE_ID,
                DEPARTMENTS_ID,
                departmentId,
                {
                    ...(updates.name && { name: updates.name }),
                    ...(updates.description !== undefined && { description: updates.description }),
                    ...(updates.color && { color: updates.color }),
                }
            );

            return c.json({ data: updated });
        }
    )

    /**
     * DELETE /organizations/:orgId/departments/:departmentId
     * Delete a department
     */
    .delete("/:orgId/:departmentId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId, departmentId } = c.req.param();

        // Verify permission
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
        if (!hasOrgPermission(role, "MANAGE_DEPARTMENTS")) {
            return c.json({ error: "Forbidden - requires MANAGE_DEPARTMENTS permission" }, 403);
        }

        // Verify department belongs to org
        const department = await databases.getDocument<Department>(
            DATABASE_ID,
            DEPARTMENTS_ID,
            departmentId
        );

        if (department.orgId !== orgId) {
            return c.json({ error: "Department not found in this organization" }, 404);
        }

        // Delete all member assignments first
        const assignments = await databases.listDocuments<OrgMemberDepartment>(
            DATABASE_ID,
            ORG_MEMBER_DEPARTMENTS_ID,
            [Query.equal("departmentId", departmentId)]
        );

        await Promise.all(
            assignments.documents.map((a) =>
                databases.deleteDocument(DATABASE_ID, ORG_MEMBER_DEPARTMENTS_ID, a.$id)
            )
        );

        // Delete department
        await databases.deleteDocument(DATABASE_ID, DEPARTMENTS_ID, departmentId);

        return c.json({ success: true });
    })

    /**
     * POST /organizations/:orgId/departments/:departmentId/members
     * Assign an org member to a department
     */
    .post(
        "/:orgId/:departmentId/members",
        sessionMiddleware,
        zValidator("json", assignMemberToDepartmentSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { orgId, departmentId } = c.req.param();
            const { orgMemberId } = c.req.valid("json");

            // Verify permission
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
            if (!hasOrgPermission(role, "MANAGE_DEPARTMENTS")) {
                return c.json({ error: "Forbidden - requires MANAGE_DEPARTMENTS permission" }, 403);
            }

            // Verify department belongs to org
            const department = await databases.getDocument<Department>(
                DATABASE_ID,
                DEPARTMENTS_ID,
                departmentId
            );

            if (department.organizationId !== orgId) {
                return c.json({ error: "Department not found in this organization" }, 404);
            }

            // Verify member belongs to org
            const memberDoc = await databases.getDocument<OrganizationMember>(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                orgMemberId
            );

            if (memberDoc.organizationId !== orgId) {
                return c.json({ error: "Member not found in this organization" }, 404);
            }

            // Check if already assigned
            const existing = await databases.listDocuments(
                DATABASE_ID,
                ORG_MEMBER_DEPARTMENTS_ID,
                [
                    Query.equal("orgMemberId", orgMemberId),
                    Query.equal("departmentId", departmentId),
                ]
            );

            if (existing.total > 0) {
                return c.json({ error: "Member is already in this department" }, 400);
            }

            const assignment = await databases.createDocument<OrgMemberDepartment>(
                DATABASE_ID,
                ORG_MEMBER_DEPARTMENTS_ID,
                ID.unique(),
                {
                    orgMemberId,
                    departmentId,
                }
            );

            return c.json({ data: assignment }, 201);
        }
    )

    /**
     * DELETE /organizations/:orgId/departments/:departmentId/members/:orgMemberId
     * Remove an org member from a department
     */
    .delete("/:orgId/:departmentId/members/:orgMemberId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId, departmentId, orgMemberId } = c.req.param();

        // Verify permission
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
        if (!hasOrgPermission(role, "MANAGE_DEPARTMENTS")) {
            return c.json({ error: "Forbidden - requires MANAGE_DEPARTMENTS permission" }, 403);
        }

        // Find and delete the assignment
        const assignments = await databases.listDocuments<OrgMemberDepartment>(
            DATABASE_ID,
            ORG_MEMBER_DEPARTMENTS_ID,
            [
                Query.equal("orgMemberId", orgMemberId),
                Query.equal("departmentId", departmentId),
            ]
        );

        if (assignments.total === 0) {
            return c.json({ error: "Member is not in this department" }, 404);
        }

        await databases.deleteDocument(
            DATABASE_ID,
            ORG_MEMBER_DEPARTMENTS_ID,
            assignments.documents[0].$id
        );

        return c.json({ success: true });
    })

    /**
     * GET /organizations/:orgId/departments/:departmentId/members
     * List all members in a department
     */
    .get("/:orgId/:departmentId/members", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { orgId, departmentId } = c.req.param();

        // Verify user is org member
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

        // Get department assignments
        const assignments = await databases.listDocuments<OrgMemberDepartment>(
            DATABASE_ID,
            ORG_MEMBER_DEPARTMENTS_ID,
            [Query.equal("departmentId", departmentId)]
        );

        if (assignments.total === 0) {
            return c.json({ data: { documents: [], total: 0 } });
        }

        // Get member details
        const orgMemberIds = assignments.documents.map((a) => a.orgMemberId);
        const members = await databases.listDocuments<OrganizationMember>(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [Query.contains("$id", orgMemberIds)]
        );

        return c.json({ data: members });
    });

export default app;
