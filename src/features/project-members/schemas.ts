import { z } from "zod";

/**
 * Validation schemas for project-members API
 */

export const createProjectMemberSchema = z.object({
    workspaceId: z.string().min(1),
    projectId: z.string().min(1),
    teamId: z.string().min(1),
    userId: z.string().min(1),
    roleId: z.string().min(1),
});

export const updateProjectMemberSchema = z.object({
    roleId: z.string().min(1).optional(),
    teamId: z.string().min(1).optional(),
});

export const getProjectMembersSchema = z.object({
    projectId: z.string().min(1),
    teamId: z.string().optional(),
    workspaceId: z.string().optional(),
});

export const getPermissionsSchema = z.object({
    projectId: z.string().min(1),
    workspaceId: z.string().optional(),
});

/**
 * Validation schemas for project-roles API
 */

export const createProjectRoleSchema = z.object({
    workspaceId: z.string().min(1),
    projectId: z.string().min(1),
    name: z.string().min(1).max(50),
    description: z.string().max(200).optional(),
    permissions: z.array(z.string()),
    color: z.string().optional(),
    isDefault: z.boolean().optional(),
});

export const updateProjectRoleSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(200).optional(),
    permissions: z.array(z.string()).optional(),
    color: z.string().optional(),
});

export const getProjectRolesSchema = z.object({
    projectId: z.string().min(1),
    workspaceId: z.string().optional(),
});
