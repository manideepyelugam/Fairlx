import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";

import {
  DATABASE_ID,
  IMAGES_BUCKET_ID,
  SPACES_ID,
  SPACE_MEMBERS_ID,
  PROJECTS_ID,
  TEAMS_ID,
  MEMBERS_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
// Usage metering for billing - every action must be metered
import { logComputeUsage, getComputeUnits } from "@/lib/usage-metering";

import {
  createSpaceSchema,
  updateSpaceSchema,
  addSpaceMemberSchema,
  updateSpaceMemberRoleSchema,
} from "../schemas";
import {
  Space,
  SpaceMember,
  SpaceVisibility,
  SpaceTemplate,
  SpaceRole,
  PopulatedSpace,
} from "../types";
import { Project } from "@/features/projects/types";
import { Team } from "@/features/teams/types";

const app = new Hono()
  // Create a new space
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createSpaceSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const {
        name,
        key,
        description,
        workspaceId,
        visibility,
        template,
        color,
        image,
      } = c.req.valid("json");

      // Check if user is a workspace member
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Only admins can create spaces
      if (member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can create spaces" }, 403);
      }

      // Check if key is unique within workspace
      const existingSpaces = await databases.listDocuments<Space>(
        DATABASE_ID,
        SPACES_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("key", key.toUpperCase()),
        ]
      );

      if (existingSpaces.total > 0) {
        return c.json({ error: "Space key already exists in this workspace" }, 400);
      }

      // Handle image upload
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

      // Get max position for ordering
      const allSpaces = await databases.listDocuments<Space>(
        DATABASE_ID,
        SPACES_ID,
        [Query.equal("workspaceId", workspaceId), Query.orderDesc("position")]
      );
      const maxPosition = allSpaces.documents[0]?.position ?? -1;

      // Create the space
      const space = await databases.createDocument<Space>(
        DATABASE_ID,
        SPACES_ID,
        ID.unique(),
        {
          name,
          key: key.toUpperCase(),
          description: description || null,
          workspaceId,
          visibility: visibility || SpaceVisibility.PUBLIC,
          template: template || SpaceTemplate.SOFTWARE,
          imageUrl: uploadedImageUrl || null,
          color: color || null,
          ownerId: user.$id,
          position: maxPosition + 1,
          archived: false,
        }
      );

      // Add creator as space admin
      await databases.createDocument<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        ID.unique(),
        {
          spaceId: space.$id,
          memberId: member.$id,
          userId: user.$id,
          role: SpaceRole.ADMIN,
          joinedAt: new Date().toISOString(),
        }
      );

      // Log compute usage for billing
      logComputeUsage({
        databases,
        workspaceId,
        units: getComputeUnits('space_create'),
        jobType: 'space_create',
        operationId: space.$id,
        sourceContext: {
          type: 'workspace',
          displayName: `Space: ${name}`,
        },
      });

      return c.json({ data: space });
    }
  )

  // Get all spaces in a workspace
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get all spaces user has access to
      const allSpaces = await databases.listDocuments<Space>(
        DATABASE_ID,
        SPACES_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("archived", false),
          Query.orderAsc("name"),
        ]
      );

      // If admin, return all spaces
      if (member.role === MemberRole.ADMIN) {
        // Get project counts and team counts for each space
        const populatedSpaces: PopulatedSpace[] = await Promise.all(
          allSpaces.documents.map(async (space) => {
            const projects = await databases.listDocuments<Project>(
              DATABASE_ID,
              PROJECTS_ID,
              [Query.equal("spaceId", space.$id)]
            );

            const members = await databases.listDocuments<SpaceMember>(
              DATABASE_ID,
              SPACE_MEMBERS_ID,
              [Query.equal("spaceId", space.$id)]
            );

            const teams = await databases.listDocuments<Team>(
              DATABASE_ID,
              TEAMS_ID,
              [Query.equal("spaceId", space.$id)]
            );

            return {
              ...space,
              projectCount: projects.total,
              memberCount: members.total,
              teamCount: teams.total,
            };
          })
        );

        return c.json({ data: { documents: populatedSpaces, total: populatedSpaces.length } });
      }

      // For non-admins, filter by visibility and membership
      const userSpaceMemberships = await databases.listDocuments<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        [Query.equal("userId", user.$id)]
      );

      const memberSpaceIds = userSpaceMemberships.documents.map((m) => m.spaceId);

      const accessibleSpaces = allSpaces.documents.filter(
        (space) =>
          space.visibility === SpaceVisibility.PUBLIC ||
          memberSpaceIds.includes(space.$id)
      );

      const populatedSpaces: PopulatedSpace[] = await Promise.all(
        accessibleSpaces.map(async (space) => {
          const projects = await databases.listDocuments<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            [Query.equal("spaceId", space.$id)]
          );

          const teams = await databases.listDocuments<Team>(
            DATABASE_ID,
            TEAMS_ID,
            [Query.equal("spaceId", space.$id)]
          );

          return {
            ...space,
            projectCount: projects.total,
            teamCount: teams.total,
          };
        })
      );

      return c.json({ data: { documents: populatedSpaces, total: populatedSpaces.length } });
    }
  )

  // Get a single space
  .get("/:spaceId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { spaceId } = c.req.param();

    const space = await databases.getDocument<Space>(
      DATABASE_ID,
      SPACES_ID,
      spaceId
    );

    const member = await getMember({
      databases,
      workspaceId: space.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check access for private spaces
    if (space.visibility === SpaceVisibility.PRIVATE && member.role !== MemberRole.ADMIN) {
      const spaceMembership = await databases.listDocuments<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        [Query.equal("spaceId", spaceId), Query.equal("userId", user.$id)]
      );

      if (spaceMembership.total === 0) {
        return c.json({ error: "Access denied to private space" }, 403);
      }
    }

    // Get project, member, and team counts
    const projects = await databases.listDocuments<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      [Query.equal("spaceId", spaceId)]
    );

    const members = await databases.listDocuments<SpaceMember>(
      DATABASE_ID,
      SPACE_MEMBERS_ID,
      [Query.equal("spaceId", spaceId)]
    );

    const teams = await databases.listDocuments<Team>(
      DATABASE_ID,
      TEAMS_ID,
      [Query.equal("spaceId", spaceId)]
    );

    const populatedSpace: PopulatedSpace = {
      ...space,
      projectCount: projects.total,
      memberCount: members.total,
      teamCount: teams.total,
    };

    return c.json({ data: populatedSpace });
  })

  // Update a space
  .patch(
    "/:spaceId",
    sessionMiddleware,
    zValidator("json", updateSpaceSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");
      const { spaceId } = c.req.param();

      const updates = c.req.valid("json");

      const space = await databases.getDocument<Space>(
        DATABASE_ID,
        SPACES_ID,
        spaceId
      );

      const member = await getMember({
        databases,
        workspaceId: space.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user can edit (workspace admin or space admin)
      if (member.role !== MemberRole.ADMIN) {
        const spaceMembership = await databases.listDocuments<SpaceMember>(
          DATABASE_ID,
          SPACE_MEMBERS_ID,
          [
            Query.equal("spaceId", spaceId),
            Query.equal("userId", user.$id),
            Query.equal("role", SpaceRole.ADMIN),
          ]
        );

        if (spaceMembership.total === 0) {
          return c.json({ error: "Only space admins can edit space settings" }, 403);
        }
      }

      // Handle image upload if provided
      let uploadedImageUrl: string | undefined;
      if (updates.image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          updates.image
        );
        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id
        );
        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer
        ).toString("base64")}`;
      }

      // Prepare update payload
      const updatePayload: Record<string, unknown> = {};
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.key !== undefined) updatePayload.key = updates.key.toUpperCase();
      if (updates.description !== undefined) updatePayload.description = updates.description;
      if (updates.visibility !== undefined) updatePayload.visibility = updates.visibility;
      if (updates.color !== undefined) updatePayload.color = updates.color;
      if (updates.archived !== undefined) updatePayload.archived = updates.archived;
      if (updates.defaultWorkflowId !== undefined) updatePayload.defaultWorkflowId = updates.defaultWorkflowId;
      if (uploadedImageUrl) updatePayload.imageUrl = uploadedImageUrl;

      const updatedSpace = await databases.updateDocument<Space>(
        DATABASE_ID,
        SPACES_ID,
        spaceId,
        updatePayload
      );

      // Log compute usage for billing
      logComputeUsage({
        databases,
        workspaceId: space.workspaceId,
        units: getComputeUnits('space_update'),
        jobType: 'space_update',
        operationId: spaceId,
        sourceContext: {
          type: 'workspace',
          displayName: `Space: ${updatedSpace.name}`,
        },
      });

      return c.json({ data: updatedSpace });
    }
  )

  // Delete a space
  .delete("/:spaceId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { spaceId } = c.req.param();

    const space = await databases.getDocument<Space>(
      DATABASE_ID,
      SPACES_ID,
      spaceId
    );

    const member = await getMember({
      databases,
      workspaceId: space.workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Only workspace admins can delete spaces" }, 403);
    }

    // Check if space has projects
    const projects = await databases.listDocuments<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      [Query.equal("spaceId", spaceId)]
    );

    if (projects.total > 0) {
      return c.json({
        error: "Cannot delete space with projects. Move or delete projects first.",
      }, 400);
    }

    // Delete all space members
    const spaceMembers = await databases.listDocuments<SpaceMember>(
      DATABASE_ID,
      SPACE_MEMBERS_ID,
      [Query.equal("spaceId", spaceId)]
    );

    await Promise.all(
      spaceMembers.documents.map((sm) =>
        databases.deleteDocument(DATABASE_ID, SPACE_MEMBERS_ID, sm.$id)
      )
    );

    // Delete the space
    await databases.deleteDocument(DATABASE_ID, SPACES_ID, spaceId);

    // Log compute usage for billing
    logComputeUsage({
      databases,
      workspaceId: space.workspaceId,
      units: getComputeUnits('space_delete'),
      jobType: 'space_delete',
      operationId: spaceId,
      sourceContext: {
        type: 'workspace',
        displayName: `Space: ${space.name}`,
      },
    });

    return c.json({ data: { $id: spaceId } });
  })

  // Add member to space
  .post(
    "/:spaceId/members",
    sessionMiddleware,
    zValidator("json", addSpaceMemberSchema.omit({ spaceId: true })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { spaceId } = c.req.param();

      const { memberId, role } = c.req.valid("json");

      const space = await databases.getDocument<Space>(
        DATABASE_ID,
        SPACES_ID,
        spaceId
      );

      const member = await getMember({
        databases,
        workspaceId: space.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check permission to add members
      if (member.role !== MemberRole.ADMIN) {
        const spaceMembership = await databases.listDocuments<SpaceMember>(
          DATABASE_ID,
          SPACE_MEMBERS_ID,
          [
            Query.equal("spaceId", spaceId),
            Query.equal("userId", user.$id),
            Query.equal("role", SpaceRole.ADMIN),
          ]
        );

        if (spaceMembership.total === 0) {
          return c.json({ error: "Only space admins can add members" }, 403);
        }
      }

      // Check if member is already in space
      const existingMembership = await databases.listDocuments<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        [Query.equal("spaceId", spaceId), Query.equal("memberId", memberId)]
      );

      if (existingMembership.total > 0) {
        return c.json({ error: "Member is already in this space" }, 400);
      }

      // Get the target member's user ID
      const targetMember = await databases.getDocument(
        DATABASE_ID,
        MEMBERS_ID,
        memberId
      );

      const spaceMember = await databases.createDocument<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        ID.unique(),
        {
          spaceId,
          memberId,
          userId: targetMember.userId,
          role: role || SpaceRole.MEMBER,
          joinedAt: new Date().toISOString(),
        }
      );

      // Log compute usage for billing
      logComputeUsage({
        databases,
        workspaceId: space.workspaceId,
        units: getComputeUnits('space_member_add'),
        jobType: 'space_member_add',
        operationId: spaceMember.$id,
        sourceContext: {
          type: 'workspace',
          displayName: `Space: ${space.name}`,
        },
      });

      return c.json({ data: spaceMember });
    }
  )

  // Get space members
  .get("/:spaceId/members", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { spaceId } = c.req.param();

    const space = await databases.getDocument<Space>(
      DATABASE_ID,
      SPACES_ID,
      spaceId
    );

    const member = await getMember({
      databases,
      workspaceId: space.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const spaceMembers = await databases.listDocuments<SpaceMember>(
      DATABASE_ID,
      SPACE_MEMBERS_ID,
      [Query.equal("spaceId", spaceId)]
    );

    return c.json({ data: spaceMembers });
  })

  // Update space member role
  .patch(
    "/:spaceId/members/:memberId",
    sessionMiddleware,
    zValidator("json", updateSpaceMemberRoleSchema.pick({ role: true })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { spaceId, memberId } = c.req.param();

      const { role } = c.req.valid("json");

      const space = await databases.getDocument<Space>(
        DATABASE_ID,
        SPACES_ID,
        spaceId
      );

      const member = await getMember({
        databases,
        workspaceId: space.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        // Check if user is space admin
        const spaceMembership = await databases.listDocuments<SpaceMember>(
          DATABASE_ID,
          SPACE_MEMBERS_ID,
          [
            Query.equal("spaceId", spaceId),
            Query.equal("userId", user.$id),
            Query.equal("role", SpaceRole.ADMIN),
          ]
        );

        if (spaceMembership.total === 0) {
          return c.json({ error: "Only admins can update member roles" }, 403);
        }
      }

      // Find the space membership to update
      const targetMembership = await databases.listDocuments<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        [Query.equal("spaceId", spaceId), Query.equal("memberId", memberId)]
      );

      if (targetMembership.total === 0) {
        return c.json({ error: "Member not found in space" }, 404);
      }

      const updatedMembership = await databases.updateDocument<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        targetMembership.documents[0].$id,
        { role }
      );

      return c.json({ data: updatedMembership });
    }
  )

  // Remove member from space
  .delete("/:spaceId/members/:memberId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { spaceId, memberId } = c.req.param();

    const space = await databases.getDocument<Space>(
      DATABASE_ID,
      SPACES_ID,
      spaceId
    );

    const member = await getMember({
      databases,
      workspaceId: space.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check permission
    if (member.role !== MemberRole.ADMIN) {
      const spaceMembership = await databases.listDocuments<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        [
          Query.equal("spaceId", spaceId),
          Query.equal("userId", user.$id),
          Query.equal("role", SpaceRole.ADMIN),
        ]
      );

      if (spaceMembership.total === 0) {
        return c.json({ error: "Only admins can remove members" }, 403);
      }
    }

    // Find and delete the membership
    const targetMembership = await databases.listDocuments<SpaceMember>(
      DATABASE_ID,
      SPACE_MEMBERS_ID,
      [Query.equal("spaceId", spaceId), Query.equal("memberId", memberId)]
    );

    if (targetMembership.total === 0) {
      return c.json({ error: "Member not found in space" }, 404);
    }

    // Don't allow removing the space owner
    if (targetMembership.documents[0].userId === space.ownerId) {
      return c.json({ error: "Cannot remove space owner" }, 400);
    }

    await databases.deleteDocument(
      DATABASE_ID,
      SPACE_MEMBERS_ID,
      targetMembership.documents[0].$id
    );

    return c.json({ data: { memberId } });
  })

  // Get current user's role in a space
  .get(
    "/member-role",
    sessionMiddleware,
    zValidator("query", z.object({ spaceId: z.string(), workspaceId: z.string() })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { spaceId, workspaceId } = c.req.valid("query");

      // Check workspace membership
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Workspace admins are automatically space masters
      if (member.role === MemberRole.ADMIN) {
        return c.json({ data: { role: SpaceRole.ADMIN, isMaster: true, isWorkspaceAdmin: true } });
      }

      // Check space membership
      const spaceMembership = await databases.listDocuments<SpaceMember>(
        DATABASE_ID,
        SPACE_MEMBERS_ID,
        [Query.equal("spaceId", spaceId), Query.equal("userId", user.$id)]
      );

      if (spaceMembership.total === 0) {
        // User is not a member of this space - check if space is public
        const space = await databases.getDocument<Space>(
          DATABASE_ID,
          SPACES_ID,
          spaceId
        );

        if (space.visibility === SpaceVisibility.PUBLIC) {
          return c.json({ data: { role: SpaceRole.VIEWER, isMaster: false, isWorkspaceAdmin: false } });
        }

        return c.json({ data: { role: null, isMaster: false, isWorkspaceAdmin: false } });
      }

      const spaceRole = spaceMembership.documents[0].role;
      return c.json({
        data: {
          role: spaceRole,
          isMaster: spaceRole === SpaceRole.ADMIN,
          isWorkspaceAdmin: false
        }
      });
    }
  );

export default app;
