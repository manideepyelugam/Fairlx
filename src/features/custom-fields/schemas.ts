import { z } from "zod";
import { CustomFieldType, CustomFieldScope } from "./types";

// Custom field option schema
const customFieldOptionSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  isDefault: z.boolean().optional(),
  position: z.number().min(0),
});

// Create custom field
export const createCustomFieldSchema = z.object({
  name: z.string().trim().min(1, "Field name is required").max(100),
  key: z.string().trim().min(1).max(50).toLowerCase()
    .regex(/^[a-z][a-z0-9_]*$/, "Key must start with a letter and contain only lowercase letters, numbers, and underscores"),
  description: z.string().trim().max(500).optional(),
  type: z.nativeEnum(CustomFieldType),
  scope: z.nativeEnum(CustomFieldScope),
  workspaceId: z.string().min(1),
  spaceId: z.string().optional(),
  projectId: z.string().optional(),
  
  isRequired: z.boolean().default(false),
  defaultValue: z.string().optional(),
  placeholder: z.string().max(100).optional(),
  
  // For SELECT/MULTI_SELECT
  options: z.array(customFieldOptionSchema).optional(),
  
  // For NUMBER types
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  precision: z.number().min(0).max(10).optional(),
  
  // For CURRENCY
  currencySymbol: z.string().max(5).optional(),
  currencyCode: z.string().length(3).optional(),
  
  // Work item type restrictions
  appliesToTypes: z.array(z.string()).optional(),
  
  // UI settings
  showInList: z.boolean().default(true),
  showInCard: z.boolean().default(false),
});

// Update custom field
export const updateCustomFieldSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  isRequired: z.boolean().optional(),
  defaultValue: z.string().optional().nullable(),
  placeholder: z.string().max(100).optional().nullable(),
  options: z.array(customFieldOptionSchema).optional(),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable(),
  precision: z.number().min(0).max(10).optional().nullable(),
  appliesToTypes: z.array(z.string()).optional().nullable(),
  showInList: z.boolean().optional(),
  showInCard: z.boolean().optional(),
  position: z.number().min(0).optional(),
  archived: z.boolean().optional(),
});

// Add option to a SELECT/MULTI_SELECT field
export const addFieldOptionSchema = z.object({
  fieldId: z.string().min(1),
  value: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

// Update option
export const updateFieldOptionSchema = z.object({
  fieldId: z.string().min(1),
  optionId: z.string().min(1),
  value: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  isDefault: z.boolean().optional(),
  position: z.number().min(0).optional(),
});

// Delete option
export const deleteFieldOptionSchema = z.object({
  fieldId: z.string().min(1),
  optionId: z.string().min(1),
});

// Create custom work item type
export const createCustomWorkItemTypeSchema = z.object({
  name: z.string().trim().min(1, "Type name is required").max(50),
  key: z.string().trim().min(1).max(20).toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Key must start with a letter and contain only uppercase letters, numbers, and underscores"),
  description: z.string().trim().max(500).optional(),
  workspaceId: z.string().min(1),
  spaceId: z.string().optional(),
  
  icon: z.string().min(1).max(10), // Emoji or icon name
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  
  defaultWorkflowId: z.string().optional(),
  defaultFields: z.array(z.string()).default([]),
  requiredFields: z.array(z.string()).default([]),
  
  canHaveParent: z.boolean().default(true),
  canHaveChildren: z.boolean().default(true),
  allowedParentTypes: z.array(z.string()).default([]),
  allowedChildTypes: z.array(z.string()).default([]),
});

// Update custom work item type
export const updateCustomWorkItemTypeSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  defaultWorkflowId: z.string().optional().nullable(),
  defaultFields: z.array(z.string()).optional(),
  requiredFields: z.array(z.string()).optional(),
  canHaveParent: z.boolean().optional(),
  canHaveChildren: z.boolean().optional(),
  allowedParentTypes: z.array(z.string()).optional(),
  allowedChildTypes: z.array(z.string()).optional(),
  position: z.number().min(0).optional(),
  archived: z.boolean().optional(),
});

// Set custom field value on a work item
export const setCustomFieldValueSchema = z.object({
  workItemId: z.string().min(1),
  fieldId: z.string().min(1),
  value: z.unknown(), // Validated based on field type at runtime
});

// Bulk set custom field values
export const bulkSetCustomFieldValuesSchema = z.object({
  workItemId: z.string().min(1),
  values: z.array(z.object({
    fieldId: z.string().min(1),
    value: z.unknown(),
  })),
});
