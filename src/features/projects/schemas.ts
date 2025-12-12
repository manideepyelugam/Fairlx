import { z } from "zod";
import { BoardType, ProjectStatus } from "./types";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required."),
  description: z.string().trim().max(2000, "Description must be 2000 characters or less.").optional(),
  deadline: z.string().optional(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
  workspaceId: z.string(),
  spaceId: z.string().optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Minimum 1 character required.").optional(),
  description: z.string().trim().max(2000, "Description must be 2000 characters or less.").optional(),
  deadline: z.string().optional().nullable(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
  spaceId: z.string().optional().nullable(),
  
  // Board configuration
  boardType: z.nativeEnum(BoardType).optional(),
  key: z.string().trim().min(2).max(10).toUpperCase()
    .regex(/^[A-Z][A-Z0-9]*$/)
    .optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  
  // Workflow
  workflowId: z.string().optional().nullable(),
  
  // Settings
  defaultAssigneeId: z.string().optional().nullable(),
  autoAssignToCreator: z.boolean().optional(),
  enableTimeTracking: z.boolean().optional(),
  
  // Kanban settings
  wipLimits: z.record(z.number().min(0)).optional(),
  defaultSwimlane: z.enum(["assignee", "epic", "type", "none"]).optional(),
  
  // Sprint settings
  defaultSprintDuration: z.number().min(1).max(60).optional(),
  sprintStartDay: z.number().min(0).max(6).optional(),
  
  // UI
  color: z.string().optional().nullable(),
  position: z.number().min(0).optional(),
});

export const assignProjectToTeamSchema = z.object({
  projectId: z.string(),
  teamId: z.string(),
});

export const unassignProjectFromTeamSchema = z.object({
  projectId: z.string(),
  teamId: z.string(),
});

export const getTeamProjectsSchema = z.object({
  teamId: z.string(),
});
