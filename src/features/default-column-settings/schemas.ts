import { z } from "zod";
import { TaskStatus } from "@/features/tasks/types";

export const defaultColumnSettingsSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  projectId: z.string().trim().min(1, "Project ID is required"),
  columnId: z.nativeEnum(TaskStatus),
  isEnabled: z.boolean(),
  position: z.number().int().min(0).max(1000000).optional(),
});

export const updateDefaultColumnSettingsSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  projectId: z.string().trim().min(1, "Project ID is required"),
  settings: z.array(z.object({
    columnId: z.nativeEnum(TaskStatus),
    isEnabled: z.boolean(),
    position: z.number().int().min(0).max(1000000).optional(),
  })).min(1, "At least one column setting is required"),
});

export const updateColumnOrderSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  projectId: z.string().trim().min(1, "Project ID is required"),
  columns: z.array(z.object({
    id: z.string().min(1, "Column ID is required"),
    type: z.enum(["default", "custom"]),
    position: z.number().int().min(0).max(1000000),
  })).min(1, "At least one column is required"),
});
