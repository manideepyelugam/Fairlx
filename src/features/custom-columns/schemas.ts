import { z } from "zod";

// Base schema without refinement - can be used with .omit(), .pick(), etc.
export const createCustomColumnBaseSchema = z.object({
  name: z.string().trim().min(1, "Column name is required"),
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  projectId: z.string().trim().optional(),    // Optional - used for project custom columns
  workflowId: z.string().trim().optional(),   // Optional - used for workflow custom columns
  icon: z.string().trim().min(1, "Icon is required"),
  color: z.string().trim().min(1, "Color is required"),
  position: z.number().int().min(0).max(1000000).optional(),
});

// Full schema with validation - used for API validation
export const createCustomColumnSchema = createCustomColumnBaseSchema.refine(
  (data) => data.projectId || data.workflowId,
  { message: "Either projectId or workflowId is required" }
);

export const updateCustomColumnSchema = z.object({
  name: z.string().trim().min(1, "Column name is required").optional(),
  icon: z.string().trim().min(1, "Icon is required").optional(),
  color: z.string().trim().min(1, "Color is required").optional(),
  position: z.number().int().min(0).max(1000000).optional(),
});
