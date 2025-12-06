import { Models } from "node-appwrite";

// Workflow status category for grouping
export enum StatusCategory {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

// Workflow - defines the status flow for a project/space
export type Workflow = Models.Document & {
  name: string;
  description?: string | null;
  workspaceId: string;
  spaceId?: string | null;        // If null, it's a workspace-level workflow
  projectId?: string | null;      // If set, project-specific workflow
  isDefault: boolean;             // Is this the default workflow for its scope
  isSystem: boolean;              // System workflows can't be deleted
};

// Workflow Status - individual status in a workflow
export type WorkflowStatus = Models.Document & {
  workflowId: string;
  name: string;
  key: string;                    // Unique key like "TODO", "IN_PROGRESS"
  category: StatusCategory;
  color: string;                  // Hex color for UI
  description?: string | null;
  position: number;               // Order in the workflow
  isInitial: boolean;             // Is this the starting status
  isFinal: boolean;               // Is this a completion status
};

// Workflow Transition - allowed status changes
export type WorkflowTransition = Models.Document & {
  workflowId: string;
  fromStatusId: string;
  toStatusId: string;
  name?: string | null;           // Optional transition name like "Start Progress"
  description?: string | null;
  // Transition rules (optional advanced features)
  requiredFields?: string[] | null;     // Fields that must be filled to transition
  allowedRoles?: string[] | null;       // Roles that can perform this transition
  autoAssign?: boolean;           // Auto-assign to current user on transition
};

// Populated types for UI
export type PopulatedWorkflowStatus = WorkflowStatus & {
  workflow?: Workflow;
};

export type PopulatedWorkflowTransition = WorkflowTransition & {
  fromStatus?: WorkflowStatus;
  toStatus?: WorkflowStatus;
};

export type PopulatedWorkflow = Workflow & {
  statuses?: WorkflowStatus[];
  transitions?: WorkflowTransition[];
  statusCount?: number;
};

// Default workflow templates
export const DEFAULT_SOFTWARE_WORKFLOW = {
  name: "Software Development",
  statuses: [
    { name: "To Do", key: "TODO", category: StatusCategory.TODO, color: "#6B7280", position: 0, isInitial: true, isFinal: false },
    { name: "In Progress", key: "IN_PROGRESS", category: StatusCategory.IN_PROGRESS, color: "#3B82F6", position: 1, isInitial: false, isFinal: false },
    { name: "In Review", key: "IN_REVIEW", category: StatusCategory.IN_PROGRESS, color: "#8B5CF6", position: 2, isInitial: false, isFinal: false },
    { name: "Done", key: "DONE", category: StatusCategory.DONE, color: "#10B981", position: 3, isInitial: false, isFinal: true },
  ],
  transitions: [
    { from: "TODO", to: "IN_PROGRESS" },
    { from: "IN_PROGRESS", to: "IN_REVIEW" },
    { from: "IN_PROGRESS", to: "TODO" },
    { from: "IN_REVIEW", to: "DONE" },
    { from: "IN_REVIEW", to: "IN_PROGRESS" },
    { from: "DONE", to: "TODO" }, // Reopen
  ],
};

export const DEFAULT_KANBAN_WORKFLOW = {
  name: "Simple Kanban",
  statuses: [
    { name: "Backlog", key: "BACKLOG", category: StatusCategory.TODO, color: "#6B7280", position: 0, isInitial: true, isFinal: false },
    { name: "To Do", key: "TODO", category: StatusCategory.TODO, color: "#F59E0B", position: 1, isInitial: false, isFinal: false },
    { name: "In Progress", key: "IN_PROGRESS", category: StatusCategory.IN_PROGRESS, color: "#3B82F6", position: 2, isInitial: false, isFinal: false },
    { name: "Done", key: "DONE", category: StatusCategory.DONE, color: "#10B981", position: 3, isInitial: false, isFinal: true },
  ],
  // Kanban allows all transitions (more flexible)
  transitions: "ALL",
};

export const DEFAULT_BUG_TRACKING_WORKFLOW = {
  name: "Bug Tracking",
  statuses: [
    { name: "Open", key: "OPEN", category: StatusCategory.TODO, color: "#EF4444", position: 0, isInitial: true, isFinal: false },
    { name: "Confirmed", key: "CONFIRMED", category: StatusCategory.TODO, color: "#F59E0B", position: 1, isInitial: false, isFinal: false },
    { name: "In Progress", key: "IN_PROGRESS", category: StatusCategory.IN_PROGRESS, color: "#3B82F6", position: 2, isInitial: false, isFinal: false },
    { name: "Fixed", key: "FIXED", category: StatusCategory.IN_PROGRESS, color: "#8B5CF6", position: 3, isInitial: false, isFinal: false },
    { name: "Verified", key: "VERIFIED", category: StatusCategory.DONE, color: "#10B981", position: 4, isInitial: false, isFinal: true },
    { name: "Closed", key: "CLOSED", category: StatusCategory.DONE, color: "#6B7280", position: 5, isInitial: false, isFinal: true },
    { name: "Won't Fix", key: "WONT_FIX", category: StatusCategory.DONE, color: "#9CA3AF", position: 6, isInitial: false, isFinal: true },
  ],
  transitions: [
    { from: "OPEN", to: "CONFIRMED" },
    { from: "OPEN", to: "WONT_FIX" },
    { from: "CONFIRMED", to: "IN_PROGRESS" },
    { from: "CONFIRMED", to: "WONT_FIX" },
    { from: "IN_PROGRESS", to: "FIXED" },
    { from: "IN_PROGRESS", to: "OPEN" },
    { from: "FIXED", to: "VERIFIED" },
    { from: "FIXED", to: "OPEN" }, // Reopen if not fixed properly
    { from: "VERIFIED", to: "CLOSED" },
    { from: "VERIFIED", to: "OPEN" }, // Reopen
  ],
};
