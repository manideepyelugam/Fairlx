import { z } from "zod";
import { ProgramStatus, ProgramMemberRole, ProgramPriority, MilestoneStatus } from "./types";

// Program Schemas
// Reusable date string validator - accepts empty, null, undefined, or valid date string
const optionalDateString = z.string().optional().or(z.literal("")).transform((val) => {
  // Normalize empty strings to undefined
  if (!val || val === "") return undefined;
  return val;
});

// Reusable imageUrl validator - accepts empty, URL, or base64 data URLs (Issue 10)
const optionalImageUrl = z.string().optional().or(z.literal("")).transform((val) => {
  // Normalize empty strings to undefined
  if (!val || val === "") return undefined;
  return val;
});

// Reusable hex color validator
const optionalHexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal("")).transform((val) => {
  if (!val || val === "") return undefined;
  return val;
});

export const createProgramSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Program name is required")
    .max(100, "Program name must be less than 100 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  programLeadId: z.string().optional(),
  imageUrl: optionalImageUrl,
  startDate: optionalDateString,
  endDate: optionalDateString,
  status: z
    .nativeEnum(ProgramStatus)
    .default(ProgramStatus.PLANNING)
    .optional(),
  // Enhanced fields
  color: optionalHexColor,
  icon: z.string().max(50).optional(),
  budget: z.number().positive().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  priority: z.nativeEnum(ProgramPriority).optional(),
}).refine((data) => {
  // Issue 12: Validate endDate is not before startDate
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

export const updateProgramSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Program name is required")
    .max(100, "Program name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  programLeadId: z.string().optional().or(z.literal("")),
  imageUrl: optionalImageUrl,
  startDate: optionalDateString,
  endDate: optionalDateString,
  status: z.nativeEnum(ProgramStatus).optional(),
  // Enhanced fields
  color: optionalHexColor,
  icon: z.string().max(50).optional().nullable(),
  budget: z.number().positive().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  priority: z.nativeEnum(ProgramPriority).optional().nullable(),
}).refine((data) => {
  // Issue 12: Validate endDate is not before startDate
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

export const getProgramSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
});

export const deleteProgramSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
});

export const getProgramsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  status: z.nativeEnum(ProgramStatus).optional(),
  programLeadId: z.string().optional(),
  search: z.string().optional(),
  priority: z.nativeEnum(ProgramPriority).optional(),
});

// ============================
// Program Member Schemas
// ============================

export const addProgramMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.nativeEnum(ProgramMemberRole).default(ProgramMemberRole.MEMBER),
});

export const updateProgramMemberSchema = z.object({
  role: z.nativeEnum(ProgramMemberRole),
});

export const removeProgramMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

export const getProgramMembersSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
});

// ============================
// Program Projects Schemas
// ============================

export const linkProjectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export const unlinkProjectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export const getProgramProjectsSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
});

// ============================
// Program Milestone Schemas
// ============================

export const createMilestoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Milestone name is required")
    .max(200, "Milestone name must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  targetDate: optionalDateString,
  status: z.nativeEnum(MilestoneStatus).default(MilestoneStatus.NOT_STARTED).optional(),
});

export const updateMilestoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Milestone name is required")
    .max(200, "Milestone name must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .nullable(),
  targetDate: optionalDateString.nullable(),
  status: z.nativeEnum(MilestoneStatus).optional(),
  progress: z.number().min(0).max(100).optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderMilestonesSchema = z.object({
  milestoneIds: z.array(z.string().min(1)).min(1, "At least one milestone ID is required"),
});

// ============================
// Program Analytics Schemas
// ============================

export const getProgramAnalyticsSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
  dateRange: z.enum(["7d", "30d", "90d", "all"]).optional().default("30d"),
});

export const getProgramTeamsSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
});

// Export all schemas as a single object
export const programSchemas = {
  // Core program schemas
  createProgram: createProgramSchema,
  updateProgram: updateProgramSchema,
  getProgram: getProgramSchema,
  deleteProgram: deleteProgramSchema,
  getPrograms: getProgramsSchema,
  // Member schemas
  addProgramMember: addProgramMemberSchema,
  updateProgramMember: updateProgramMemberSchema,
  removeProgramMember: removeProgramMemberSchema,
  getProgramMembers: getProgramMembersSchema,
  // Project schemas
  linkProject: linkProjectSchema,
  unlinkProject: unlinkProjectSchema,
  getProgramProjects: getProgramProjectsSchema,
  // Milestone schemas
  createMilestone: createMilestoneSchema,
  updateMilestone: updateMilestoneSchema,
  reorderMilestones: reorderMilestonesSchema,
  // Analytics schemas
  getProgramAnalytics: getProgramAnalyticsSchema,
  getProgramTeams: getProgramTeamsSchema,
};
