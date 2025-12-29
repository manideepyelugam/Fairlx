import { z } from "zod";
import { ProgramStatus } from "./types";

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
});

export const getProgramAnalyticsSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
});

export const getProgramTeamsSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
});

// Export all schemas as a single object
export const programSchemas = {
  createProgram: createProgramSchema,
  updateProgram: updateProgramSchema,
  getProgram: getProgramSchema,
  deleteProgram: deleteProgramSchema,
  getPrograms: getProgramsSchema,
  getProgramAnalytics: getProgramAnalyticsSchema,
  getProgramTeams: getProgramTeamsSchema,
};
