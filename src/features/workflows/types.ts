import { Models } from "node-appwrite";
import { Node, Edge } from "@xyflow/react";

// ===================================
// Status Categories (Simplified)
// ===================================
export enum StatusCategory {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export const STATUS_CATEGORY_CONFIG = {
  [StatusCategory.TODO]: {
    label: "To Do",
    description: "Work not yet started",
    defaultColor: "#6B7280",
    icon: "Circle",
  },
  [StatusCategory.IN_PROGRESS]: {
    label: "In Progress",
    description: "Work currently being done",
    defaultColor: "#3B82F6",
    icon: "Clock",
  },
  [StatusCategory.DONE]: {
    label: "Done",
    description: "Work completed",
    defaultColor: "#10B981",
    icon: "CheckCircle",
  },
};

// ===================================
// Workflow - Core Entity
// ===================================
export type Workflow = Models.Document & {
  name: string;
  key: string;
  description?: string | null;
  workspaceId: string;
  spaceId?: string | null;
  projectId?: string | null;
  isDefault: boolean;
  isSystem: boolean;
  isArchived: boolean;
};

// ===================================
// Workflow Status
// ===================================
export type WorkflowStatus = Models.Document & {
  workflowId: string;
  name: string;
  key: string;
  category: StatusCategory;
  color: string;
  description?: string | null;
  position: number;
  positionX: number;
  positionY: number;
  isInitial: boolean;
  isFinal: boolean;
};

// ===================================
// Workflow Transition (Edge)
// ===================================
export type WorkflowTransition = Models.Document & {
  workflowId: string;
  fromStatusId: string;
  toStatusId: string;
  name?: string | null;
  description?: string | null;
  requiredFields?: string[] | null;
  allowedRoles?: string[] | null;
  autoAssign?: boolean;
};

// ===================================
// Populated Types for UI
// ===================================
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
  transitionCount?: number;
};

// ===================================
// React Flow Types
// ===================================
export interface StatusNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  category: StatusCategory;
  color: string;
  description?: string | null;
  isInitial: boolean;
  isFinal: boolean;
  position: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRemove?: (id: string) => void;
  [key: string]: unknown;
}

export type StatusNode = Node<StatusNodeData, "statusNode">;

export interface TransitionEdgeData extends Record<string, unknown> {
  id: string;
  name?: string | null;
  description?: string | null;
  requiredFields?: string[] | null;
  allowedRoles?: string[] | null;
  autoAssign?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  [key: string]: unknown;
}

export type TransitionEdge = Edge<TransitionEdgeData>;

// ===================================
// Workflow Templates
// ===================================
export interface WorkflowTemplateStatus {
  name: string;
  key: string;
  category: StatusCategory;
  color: string;
  description?: string;
  position: number;
  positionX: number;
  positionY: number;
  isInitial: boolean;
  isFinal: boolean;
}

export interface WorkflowTemplateTransition {
  from: string;
  to: string;
  name?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  key: string;
  description: string;
  icon: string;
  statuses: WorkflowTemplateStatus[];
  transitions: WorkflowTemplateTransition[] | "ALL";
}

// ===================================
// Default Templates
// ===================================
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "software-dev",
    name: "Software Development",
    key: "SOFTWARE_DEV",
    description: "Standard software development workflow with code review",
    icon: "Code",
    statuses: [
      { name: "To Do", key: "TODO", category: StatusCategory.TODO, color: "#6B7280", position: 0, positionX: 100, positionY: 200, isInitial: true, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", category: StatusCategory.IN_PROGRESS, color: "#3B82F6", position: 1, positionX: 350, positionY: 100, isInitial: false, isFinal: false },
      { name: "In Review", key: "IN_REVIEW", category: StatusCategory.IN_PROGRESS, color: "#8B5CF6", position: 2, positionX: 350, positionY: 300, isInitial: false, isFinal: false },
      { name: "Done", key: "DONE", category: StatusCategory.DONE, color: "#10B981", position: 3, positionX: 600, positionY: 200, isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "TODO", to: "IN_PROGRESS", name: "Start Work" },
      { from: "IN_PROGRESS", to: "IN_REVIEW", name: "Submit for Review" },
      { from: "IN_REVIEW", to: "DONE", name: "Approve" },
      { from: "IN_REVIEW", to: "IN_PROGRESS", name: "Request Changes" },
    ],
  },
  {
    id: "kanban",
    name: "Simple Kanban",
    key: "KANBAN",
    description: "Flexible Kanban board with free transitions",
    icon: "Columns3",
    statuses: [
      { name: "Backlog", key: "BACKLOG", category: StatusCategory.TODO, color: "#9CA3AF", position: 0, positionX: 100, positionY: 150, isInitial: true, isFinal: false },
      { name: "To Do", key: "TODO", category: StatusCategory.TODO, color: "#F59E0B", position: 1, positionX: 300, positionY: 150, isInitial: false, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", category: StatusCategory.IN_PROGRESS, color: "#3B82F6", position: 2, positionX: 500, positionY: 150, isInitial: false, isFinal: false },
      { name: "Done", key: "DONE", category: StatusCategory.DONE, color: "#10B981", position: 3, positionX: 700, positionY: 150, isInitial: false, isFinal: true },
    ],
    transitions: "ALL",
  },
  {
    id: "bug-tracking",
    name: "Bug Tracking",
    key: "BUG_TRACKING",
    description: "Track bugs from report to resolution",
    icon: "Bug",
    statuses: [
      { name: "Open", key: "OPEN", category: StatusCategory.TODO, color: "#EF4444", position: 0, positionX: 100, positionY: 200, isInitial: true, isFinal: false },
      { name: "Confirmed", key: "CONFIRMED", category: StatusCategory.TODO, color: "#F59E0B", position: 1, positionX: 300, positionY: 100, isInitial: false, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", category: StatusCategory.IN_PROGRESS, color: "#3B82F6", position: 2, positionX: 300, positionY: 300, isInitial: false, isFinal: false },
      { name: "Fixed", key: "FIXED", category: StatusCategory.IN_PROGRESS, color: "#8B5CF6", position: 3, positionX: 500, positionY: 200, isInitial: false, isFinal: false },
      { name: "Verified", key: "VERIFIED", category: StatusCategory.DONE, color: "#10B981", position: 4, positionX: 700, positionY: 100, isInitial: false, isFinal: true },
      { name: "Closed", key: "CLOSED", category: StatusCategory.DONE, color: "#6B7280", position: 5, positionX: 700, positionY: 300, isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "OPEN", to: "CONFIRMED", name: "Confirm Bug" },
      { from: "OPEN", to: "CLOSED", name: "Close as Invalid" },
      { from: "CONFIRMED", to: "IN_PROGRESS", name: "Start Fix" },
      { from: "IN_PROGRESS", to: "FIXED", name: "Mark as Fixed" },
      { from: "IN_PROGRESS", to: "OPEN", name: "Reopen" },
      { from: "FIXED", to: "VERIFIED", name: "Verify Fix" },
      { from: "FIXED", to: "OPEN", name: "Reopen" },
      { from: "VERIFIED", to: "CLOSED", name: "Close" },
    ],
  },
  {
    id: "sprint-agile",
    name: "Sprint/Agile",
    key: "SPRINT_AGILE",
    description: "Agile workflow for sprint-based development",
    icon: "Zap",
    statuses: [
      { name: "Backlog", key: "BACKLOG", category: StatusCategory.TODO, color: "#9CA3AF", position: 0, positionX: 100, positionY: 200, isInitial: true, isFinal: false },
      { name: "Selected", key: "SELECTED", category: StatusCategory.TODO, color: "#F59E0B", position: 1, positionX: 280, positionY: 200, isInitial: false, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", category: StatusCategory.IN_PROGRESS, color: "#3B82F6", position: 2, positionX: 460, positionY: 100, isInitial: false, isFinal: false },
      { name: "Blocked", key: "BLOCKED", category: StatusCategory.IN_PROGRESS, color: "#EF4444", position: 3, positionX: 460, positionY: 300, isInitial: false, isFinal: false },
      { name: "Review", key: "REVIEW", category: StatusCategory.IN_PROGRESS, color: "#8B5CF6", position: 4, positionX: 640, positionY: 200, isInitial: false, isFinal: false },
      { name: "Done", key: "DONE", category: StatusCategory.DONE, color: "#10B981", position: 5, positionX: 820, positionY: 200, isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "BACKLOG", to: "SELECTED", name: "Select for Sprint" },
      { from: "SELECTED", to: "IN_PROGRESS", name: "Start Work" },
      { from: "SELECTED", to: "BACKLOG", name: "Move Back" },
      { from: "IN_PROGRESS", to: "BLOCKED", name: "Mark Blocked" },
      { from: "IN_PROGRESS", to: "REVIEW", name: "Submit for Review" },
      { from: "BLOCKED", to: "IN_PROGRESS", name: "Unblock" },
      { from: "REVIEW", to: "DONE", name: "Approve" },
      { from: "REVIEW", to: "IN_PROGRESS", name: "Request Changes" },
      { from: "DONE", to: "BACKLOG", name: "Reopen" },
    ],
  },
];

// ===================================
// Color Presets
// ===================================
export const STATUS_COLORS = [
  { name: "Gray", value: "#6B7280" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Green", value: "#22C55E" },
  { name: "Emerald", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
];

// ===================================
// Helper Functions
// ===================================
export function convertStatusesToNodes(
  statuses: WorkflowStatus[],
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onRemove?: (id: string) => void
): StatusNode[] {
  return statuses.map((status) => ({
    id: status.$id,
    type: "statusNode",
    position: { x: status.positionX || status.position * 280, y: status.positionY || 150 },
    data: {
      id: status.$id,
      name: status.name,
      key: status.key,
      category: status.category,
      color: status.color,
      description: status.description,
      isInitial: status.isInitial,
      isFinal: status.isFinal,
      position: status.position,
      onEdit,
      onDelete,
      onRemove,
    },
  }));
}

export function convertTransitionsToEdges(
  transitions: WorkflowTransition[],
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): TransitionEdge[] {
  return transitions.map((transition) => ({
    id: transition.$id,
    source: transition.fromStatusId,
    target: transition.toStatusId,
    type: "transitionEdge",
    animated: true,
    data: {
      id: transition.$id,
      name: transition.name,
      description: transition.description,
      requiredFields: transition.requiredFields,
      allowedRoles: transition.allowedRoles,
      autoAssign: transition.autoAssign,
      onEdit,
      onDelete,
    },
  }));
}

// Legacy exports for backwards compatibility
export const DEFAULT_SOFTWARE_WORKFLOW = WORKFLOW_TEMPLATES[0];
export const DEFAULT_KANBAN_WORKFLOW = WORKFLOW_TEMPLATES[1];
export const DEFAULT_BUG_TRACKING_WORKFLOW = WORKFLOW_TEMPLATES[2];
