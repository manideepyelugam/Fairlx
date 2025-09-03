import { z } from "zod";
import { TaskStatus } from "@/features/tasks/types";

export const defaultColumnSettingsSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  projectId: z.string().trim().min(1, "Project ID is required"),
  columnId: z.nativeEnum(TaskStatus),
  isEnabled: z.boolean(),
});

export const updateDefaultColumnSettingsSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  projectId: z.string().trim().min(1, "Project ID is required"),
  settings: z.array(z.object({
    columnId: z.nativeEnum(TaskStatus),
    isEnabled: z.boolean(),
  })).min(1, "At least one column setting is required"),
});
