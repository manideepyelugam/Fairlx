import { z } from "zod";
import { ProgramStatus } from "./types";

// Program Schemas
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
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z
    .nativeEnum(ProgramStatus)
    .default(ProgramStatus.PLANNING)
    .optional(),
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
    .optional(),
  programLeadId: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  startDate: z.string().datetime().optional().or(z.literal("")),
  endDate: z.string().datetime().optional().or(z.literal("")),
  status: z.nativeEnum(ProgramStatus).optional(),
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
