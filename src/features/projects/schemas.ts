import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required."),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
  workspaceId: z.string(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Minimum 1 character required.").optional(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
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
