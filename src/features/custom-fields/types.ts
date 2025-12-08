import { Models } from "node-appwrite";

// Custom field types
export enum CustomFieldType {
  TEXT = "TEXT",               // Single line text
  TEXTAREA = "TEXTAREA",       // Multi-line text
  NUMBER = "NUMBER",           // Numeric value
  DATE = "DATE",               // Date picker
  DATETIME = "DATETIME",       // Date and time picker
  SELECT = "SELECT",           // Single select dropdown
  MULTI_SELECT = "MULTI_SELECT", // Multi select dropdown
  USER = "USER",               // User picker
  USERS = "USERS",             // Multiple users picker
  CHECKBOX = "CHECKBOX",       // Boolean checkbox
  URL = "URL",                 // URL field
  EMAIL = "EMAIL",             // Email field
  CURRENCY = "CURRENCY",       // Currency field with symbol
  PERCENTAGE = "PERCENTAGE",   // Percentage field
  LABELS = "LABELS",           // Label/tag picker
}

// Scope where custom field applies
export enum CustomFieldScope {
  WORKSPACE = "WORKSPACE",     // Available across workspace
  SPACE = "SPACE",             // Available in a specific space
  PROJECT = "PROJECT",         // Available in a specific project
}

// Custom field definition
export type CustomField = Models.Document & {
  name: string;
  key: string;                 // Unique key like "risk_level"
  description?: string | null;
  type: CustomFieldType;
  scope: CustomFieldScope;
  workspaceId: string;
  spaceId?: string | null;     // If scope is SPACE
  projectId?: string | null;   // If scope is PROJECT
  
  // Configuration
  isRequired: boolean;
  defaultValue?: string | null; // JSON-encoded default value
  placeholder?: string | null;
  
  // For SELECT/MULTI_SELECT types
  options?: CustomFieldOption[] | null;
  
  // For NUMBER/CURRENCY/PERCENTAGE types
  minValue?: number | null;
  maxValue?: number | null;
  precision?: number | null;   // Decimal places
  
  // For CURRENCY type
  currencySymbol?: string | null;
  currencyCode?: string | null; // ISO currency code like "USD"
  
  // Applies to which work item types (empty = all types)
  appliesToTypes?: string[] | null; // ["TASK", "BUG", "STORY"]
  
  // UI settings
  position: number;            // Order in forms
  showInList: boolean;         // Show in list/table view
  showInCard: boolean;         // Show on kanban card
  
  archived: boolean;
};

// Options for SELECT/MULTI_SELECT fields
export type CustomFieldOption = {
  id: string;                  // Unique option ID
  value: string;               // Display value
  color?: string | null;       // Optional color for the option
  description?: string | null;
  isDefault?: boolean;         // Is this the default selection
  position: number;            // Order in dropdown
};

// Custom field value stored on work items
// This is stored as JSON in work_items.customFields column
export type CustomFieldValue = {
  fieldId: string;
  value: unknown;              // Type depends on field type
  // TEXT/TEXTAREA/URL/EMAIL: string
  // NUMBER/CURRENCY/PERCENTAGE: number
  // DATE/DATETIME: ISO date string
  // SELECT: option ID string
  // MULTI_SELECT: array of option ID strings
  // USER: user ID string
  // USERS: array of user ID strings
  // CHECKBOX: boolean
  // LABELS: array of label strings
};

// Custom work item type definition
export type CustomWorkItemType = Models.Document & {
  name: string;
  key: string;                 // Unique key like "RISK", "CHANGE_REQUEST"
  description?: string | null;
  workspaceId: string;
  spaceId?: string | null;     // If scoped to a space
  
  // Visual settings
  icon: string;                // Icon name or emoji
  color: string;               // Hex color
  
  // Configuration
  defaultWorkflowId?: string | null;  // Specific workflow for this type
  defaultFields: string[];     // Custom field IDs to include by default
  requiredFields: string[];    // Custom field IDs that are required
  
  // Hierarchy settings
  canHaveParent: boolean;      // Can be child of another item
  canHaveChildren: boolean;    // Can have children
  allowedParentTypes: string[]; // Which types can be parents
  allowedChildTypes: string[]; // Which types can be children
  
  position: number;
  isSystem: boolean;           // System types can't be deleted
  archived: boolean;
};

// Populated types for UI
export type PopulatedCustomField = CustomField & {
  valueCount?: number;         // How many items use this field
};

export type PopulatedCustomWorkItemType = CustomWorkItemType & {
  workflow?: {
    $id: string;
    name: string;
  };
  defaultFieldDetails?: CustomField[];
};

// Default system work item types
export const SYSTEM_WORK_ITEM_TYPES = [
  {
    name: "Epic",
    key: "EPIC",
    icon: "📦",
    color: "#8B5CF6",
    canHaveParent: false,
    canHaveChildren: true,
    allowedParentTypes: [],
    allowedChildTypes: ["STORY", "TASK", "BUG"],
  },
  {
    name: "Story",
    key: "STORY",
    icon: "📖",
    color: "#10B981",
    canHaveParent: true,
    canHaveChildren: true,
    allowedParentTypes: ["EPIC"],
    allowedChildTypes: ["SUBTASK"],
  },
  {
    name: "Task",
    key: "TASK",
    icon: "✅",
    color: "#3B82F6",
    canHaveParent: true,
    canHaveChildren: true,
    allowedParentTypes: ["EPIC", "STORY"],
    allowedChildTypes: ["SUBTASK"],
  },
  {
    name: "Bug",
    key: "BUG",
    icon: "🐛",
    color: "#EF4444",
    canHaveParent: true,
    canHaveChildren: true,
    allowedParentTypes: ["EPIC"],
    allowedChildTypes: ["SUBTASK"],
  },
  {
    name: "Sub-task",
    key: "SUBTASK",
    icon: "📌",
    color: "#6B7280",
    canHaveParent: true,
    canHaveChildren: false,
    allowedParentTypes: ["STORY", "TASK", "BUG"],
    allowedChildTypes: [],
  },
];

// Common custom field templates
export const CUSTOM_FIELD_TEMPLATES = {
  riskLevel: {
    name: "Risk Level",
    key: "risk_level",
    type: CustomFieldType.SELECT,
    options: [
      { id: "low", value: "Low", color: "#10B981", position: 0 },
      { id: "medium", value: "Medium", color: "#F59E0B", position: 1 },
      { id: "high", value: "High", color: "#EF4444", position: 2 },
    ],
  },
  environment: {
    name: "Environment",
    key: "environment",
    type: CustomFieldType.MULTI_SELECT,
    options: [
      { id: "dev", value: "Development", color: "#3B82F6", position: 0 },
      { id: "staging", value: "Staging", color: "#F59E0B", position: 1 },
      { id: "prod", value: "Production", color: "#EF4444", position: 2 },
    ],
  },
  severity: {
    name: "Severity",
    key: "severity",
    type: CustomFieldType.SELECT,
    appliesToTypes: ["BUG"],
    options: [
      { id: "trivial", value: "Trivial", color: "#6B7280", position: 0 },
      { id: "minor", value: "Minor", color: "#10B981", position: 1 },
      { id: "major", value: "Major", color: "#F59E0B", position: 2 },
      { id: "critical", value: "Critical", color: "#EF4444", position: 3 },
      { id: "blocker", value: "Blocker", color: "#7C3AED", position: 4 },
    ],
  },
  businessValue: {
    name: "Business Value",
    key: "business_value",
    type: CustomFieldType.NUMBER,
    minValue: 1,
    maxValue: 100,
  },
  acceptanceCriteria: {
    name: "Acceptance Criteria",
    key: "acceptance_criteria",
    type: CustomFieldType.TEXTAREA,
    appliesToTypes: ["STORY"],
  },
  stepsToReproduce: {
    name: "Steps to Reproduce",
    key: "steps_to_reproduce",
    type: CustomFieldType.TEXTAREA,
    appliesToTypes: ["BUG"],
  },
  affectedVersion: {
    name: "Affected Version",
    key: "affected_version",
    type: CustomFieldType.TEXT,
    appliesToTypes: ["BUG"],
  },
  fixVersion: {
    name: "Fix Version",
    key: "fix_version",
    type: CustomFieldType.TEXT,
  },
  targetRelease: {
    name: "Target Release",
    key: "target_release",
    type: CustomFieldType.DATE,
  },
  reviewer: {
    name: "Reviewer",
    key: "reviewer",
    type: CustomFieldType.USER,
  },
  qaAssignee: {
    name: "QA Assignee",
    key: "qa_assignee",
    type: CustomFieldType.USER,
  },
  epicLink: {
    name: "Epic Link",
    key: "epic_link",
    type: CustomFieldType.URL,
  },
};
