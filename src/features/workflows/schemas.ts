import { z } from "zod";
import { StatusCategory } from "./types";

// Create a new workflow
export const createWorkflowSchema = z.object({
  name: z.string().trim().min(1, "Workflow name is required").max(100),
  key: z.string().trim().min(1, "Workflow key is required").max(50).toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Key must start with a letter and contain only letters, numbers, and underscores"),
  description: z.string().trim().max(500).optional(),
  workspaceId: z.string().min(1),
  spaceId: z.string().optional(),
  projectId: z.string().optional(),
  isDefault: z.boolean().default(false),
  copyFromWorkflowId: z.string().optional(), // Clone from existing workflow
});

// Update workflow
export const updateWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  isDefault: z.boolean().optional(),
});

// Create a status in a workflow
export const createWorkflowStatusSchema = z.object({
  workflowId: z.string().min(1),
  name: z.string().trim().min(1, "Status name is required").max(50),
  key: z.string().trim().min(1).max(30).toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Key must start with a letter and contain only letters, numbers, and underscores"),
  category: z.nativeEnum(StatusCategory),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  description: z.string().trim().max(200).optional(),
  position: z.number().min(0).optional(),
  isInitial: z.boolean().default(false),
  isFinal: z.boolean().default(false),
});

// Update a status
export const updateWorkflowStatusSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  category: z.nativeEnum(StatusCategory).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  description: z.string().trim().max(200).optional().nullable(),
  position: z.number().min(0).optional(),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
});

// Create a transition between statuses
export const createWorkflowTransitionSchema = z.object({
  workflowId: z.string().min(1),
  fromStatusId: z.string().min(1),
  toStatusId: z.string().min(1),
  name: z.string().trim().max(50).optional(),
  description: z.string().trim().max(200).optional(),
  requiredFields: z.array(z.string()).optional(),
  allowedRoles: z.array(z.string()).optional(),
  autoAssign: z.boolean().default(false),
});

// Update a transition
export const updateWorkflowTransitionSchema = z.object({
  name: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(200).optional().nullable(),
  requiredFields: z.array(z.string()).optional().nullable(),
  allowedRoles: z.array(z.string()).optional().nullable(),
  autoAssign: z.boolean().optional(),
});

// Validate a status transition (for work item updates)
export const validateTransitionSchema = z.object({
  workflowId: z.string().min(1),
  fromStatusId: z.string().min(1),
  toStatusId: z.string().min(1),
  userId: z.string().min(1),
  workItemData: z.record(z.unknown()).optional(), // Work item fields for validation
});

// Bulk create statuses (for workflow templates)
export const bulkCreateStatusesSchema = z.object({
  workflowId: z.string().min(1),
  statuses: z.array(z.object({
    name: z.string().trim().min(1).max(50),
    key: z.string().trim().min(1).max(30).toUpperCase(),
    category: z.nativeEnum(StatusCategory),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    position: z.number().min(0),
    isInitial: z.boolean().default(false),
    isFinal: z.boolean().default(false),
  })),
});

// Bulk create transitions
export const bulkCreateTransitionsSchema = z.object({
  workflowId: z.string().min(1),
  transitions: z.array(z.object({
    fromStatusKey: z.string(),
    toStatusKey: z.string(),
    name: z.string().optional(),
  })),
  allowAll: z.boolean().default(false), // If true, create all possible transitions
});
