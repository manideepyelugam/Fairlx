import { z } from "zod";

export const createCustomColumnSchema = z.object({
  name: z.string().trim().min(1, "Column name is required"),
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  projectId: z.string().trim().min(1, "Project ID is required"),
  icon: z.string().trim().min(1, "Icon is required"),
  color: z.string().trim().min(1, "Color is required"),
  position: z.number().int().min(0).max(1000000).optional(),
});

export const updateCustomColumnSchema = z.object({
  name: z.string().trim().min(1, "Column name is required").optional(),
  icon: z.string().trim().min(1, "Icon is required").optional(),
  color: z.string().trim().min(1, "Color is required").optional(),
  position: z.number().int().min(0).max(1000000).optional(),
});
