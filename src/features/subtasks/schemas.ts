import { z } from "zod";

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  workItemId: z.string().trim().min(1, "Work item ID is required"),
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  completed: z.boolean().default(false),
});

export const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").optional(),
  completed: z.boolean().optional(),
  position: z.number().optional(),
});
