import { z } from "zod";
import {
  TeamVisibility,
  TeamMemberRole,
  TeamMemberAvailability,
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
  programId: z.string().optional(),
  teamLeadId: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
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
  programId: z.string().optional().or(z.literal("")),
  teamLeadId: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
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

// Team Analytics Schemas
export const getTeamAnalyticsSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const getTeamCapacitySchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  sprintId: z.string().optional(),
});

export const getTeamPerformanceSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  period: z.string().min(1, "Period is required"), // e.g., "2024-Q1" or "Sprint 5"
});

// Bulk operations
export const bulkAddMembersSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  memberIds: z
    .array(z.string())
    .min(1, "At least one member ID is required")
    .max(50, "Cannot add more than 50 members at once"),
  role: z.nativeEnum(TeamMemberRole).default(TeamMemberRole.MEMBER).optional(),
  availability: z
    .nativeEnum(TeamMemberAvailability)
    .default(TeamMemberAvailability.FULL_TIME)
    .optional(),
});

export const bulkRemoveMembersSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  memberIds: z
    .array(z.string())
    .min(1, "At least one member ID is required")
    .max(50, "Cannot remove more than 50 members at once"),
});

// Assignment schemas (for tasks)
export const assignTeamToTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
});

export const assignTeamsToTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  teamIds: z
    .array(z.string())
    .min(1, "At least one team ID is required")
    .max(10, "Cannot assign more than 10 teams to a task"),
});

export const unassignTeamFromTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
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
  getTeamAnalytics: getTeamAnalyticsSchema,
  getTeamCapacity: getTeamCapacitySchema,
  getTeamPerformance: getTeamPerformanceSchema,
  bulkAddMembers: bulkAddMembersSchema,
  bulkRemoveMembers: bulkRemoveMembersSchema,
  assignTeamToTask: assignTeamToTaskSchema,
  assignTeamsToTask: assignTeamsToTaskSchema,
  unassignTeamFromTask: unassignTeamFromTaskSchema,
};
