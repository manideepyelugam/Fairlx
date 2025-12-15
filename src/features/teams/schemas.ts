import { z } from "zod";
import {
  TeamVisibility,
  TeamMemberRole,
  TeamMemberAvailability,
  TeamPermission,
} from "./types";

// Team Schemas
export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Team name is required")
    .max(100, "Team name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  spaceId: z.string().optional().nullable(),
  programId: z.string().optional(),
  teamLeadId: z.string().optional(),
  imageUrl: z.union([z.string().url("Invalid image URL"), z.literal("")]).optional(),
  visibility: z
    .nativeEnum(TeamVisibility)
    .default(TeamVisibility.ALL)
    .optional(),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Team name is required")
    .max(100, "Team name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  spaceId: z.string().optional().nullable(),
  programId: z.string().optional().or(z.literal("")),
  teamLeadId: z.string().optional().or(z.literal("")),
  imageUrl: z.union([z.string().url("Invalid image URL"), z.literal("")]).optional(),
  visibility: z.nativeEnum(TeamVisibility).optional(),
});

export const getTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

export const deleteTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

export const getTeamsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  spaceId: z.string().optional(),
  programId: z.string().optional(),
  visibility: z.nativeEnum(TeamVisibility).optional(),
  teamLeadId: z.string().optional(),
  search: z.string().optional(),
});

// Team Member Schemas
export const addTeamMemberSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  role: z.nativeEnum(TeamMemberRole).default(TeamMemberRole.MEMBER).optional(),
  availability: z
    .nativeEnum(TeamMemberAvailability)
    .default(TeamMemberAvailability.FULL_TIME)
    .optional(),
});

export const updateTeamMemberSchema = z.object({
  role: z.nativeEnum(TeamMemberRole).optional(),
  customRoleId: z.string().optional().or(z.literal("")),
  availability: z.nativeEnum(TeamMemberAvailability).optional(),
  isActive: z.boolean().optional(),
});

export const removeTeamMemberSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  teamMemberId: z.string().min(1, "Team member ID is required"),
});

export const getTeamMembersSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  role: z.nativeEnum(TeamMemberRole).optional(),
  availability: z.nativeEnum(TeamMemberAvailability).optional(),
  isActive: z.boolean().optional(),
});

export const getMemberTeamsSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  isActive: z.boolean().optional(),
});

// Custom Role Schemas
export const createCustomRoleSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .max(50, "Role name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  color: z.string().optional(),
  permissions: z.array(z.nativeEnum(TeamPermission)).min(1, "At least one permission is required"),
  isDefault: z.boolean().optional(),
});

export const updateCustomRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .max(50, "Role name must be less than 50 characters")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  color: z.string().optional(),
  permissions: z.array(z.nativeEnum(TeamPermission)).optional(),
  isDefault: z.boolean().optional(),
});

export const getCustomRolesSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

export const deleteCustomRoleSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

// Export all schemas as a single object for easy import
export const teamSchemas = {
  createTeam: createTeamSchema,
  updateTeam: updateTeamSchema,
  getTeam: getTeamSchema,
  deleteTeam: deleteTeamSchema,
  getTeams: getTeamsSchema,
  addTeamMember: addTeamMemberSchema,
  updateTeamMember: updateTeamMemberSchema,
  removeTeamMember: removeTeamMemberSchema,
  getTeamMembers: getTeamMembersSchema,
  getMemberTeams: getMemberTeamsSchema,
  createCustomRole: createCustomRoleSchema,
  updateCustomRole: updateCustomRoleSchema,
  getCustomRoles: getCustomRolesSchema,
  deleteCustomRole: deleteCustomRoleSchema,
};
