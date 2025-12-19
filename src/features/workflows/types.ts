import { Models } from "node-appwrite";
import { Node, Edge } from "@xyflow/react";

// ===================================
// Status Type - Simple 3-value enum for analytics/grouping
// ===================================
export enum StatusType {
  OPEN = "OPEN",           // Work not yet started (maps to TODO, ASSIGNED, BACKLOG, etc.)
  IN_PROGRESS = "IN_PROGRESS", // Work actively being done (maps to IN_PROGRESS, IN_REVIEW, etc.)
  CLOSED = "CLOSED",       // Work completed (maps to DONE, VERIFIED, CLOSED, etc.)
}

export const STATUS_TYPE_CONFIG: Record<StatusType, {
  label: string;
  description: string;
  defaultColor: string;
}> = {
  [StatusType.OPEN]: {
    label: "Open",
    description: "Work not yet started",
    defaultColor: "#6B7280",
  },
  [StatusType.IN_PROGRESS]: {
    label: "In Progress",
    description: "Work currently being done",
    defaultColor: "#3B82F6",
  },
  [StatusType.CLOSED]: {
    label: "Closed",
    description: "Work completed",
    defaultColor: "#10B981",
  },
};

// ===================================
// Available Status Icons
// ===================================
export const STATUS_ICONS = [
  { name: "Circle", label: "Circle" },
  { name: "CircleDot", label: "Circle Dot" },
  { name: "CircleDashed", label: "Dashed Circle" },
  { name: "Clock", label: "Clock" },
  { name: "Timer", label: "Timer" },
  { name: "Play", label: "Play" },
  { name: "Pause", label: "Pause" },
  { name: "Square", label: "Square" },
  { name: "CheckSquare", label: "Check Square" },
  { name: "CheckCircle", label: "Check Circle" },
  { name: "CheckCircle2", label: "Check Circle 2" },
  { name: "XCircle", label: "X Circle" },
  { name: "AlertCircle", label: "Alert Circle" },
  { name: "AlertTriangle", label: "Alert Triangle" },
  { name: "Bug", label: "Bug" },
  { name: "Zap", label: "Zap" },
  { name: "Star", label: "Star" },
  { name: "Flag", label: "Flag" },
  { name: "Bookmark", label: "Bookmark" },
  { name: "Eye", label: "Eye" },
  { name: "EyeOff", label: "Eye Off" },
  { name: "Lock", label: "Lock" },
  { name: "Unlock", label: "Unlock" },
  { name: "Archive", label: "Archive" },
  { name: "Trash", label: "Trash" },
  { name: "Send", label: "Send" },
  { name: "MessageSquare", label: "Message" },
  { name: "UserCheck", label: "User Check" },
  { name: "Users", label: "Users" },
  { name: "Sparkles", label: "Sparkles" },
  { name: "Rocket", label: "Rocket" },
  { name: "Target", label: "Target" },
  { name: "Crosshair", label: "Crosshair" },
  { name: "Shield", label: "Shield" },
  { name: "ShieldCheck", label: "Shield Check" },
  { name: "ThumbsUp", label: "Thumbs Up" },
  { name: "ThumbsDown", label: "Thumbs Down" },
  { name: "Ban", label: "Ban" },
  { name: "Loader", label: "Loader" },
  { name: "RefreshCw", label: "Refresh" },
] as const;

export type StatusIconName = typeof STATUS_ICONS[number]["name"];

// ===================================
// Workflow - Core Entity
// ===================================
export type Workflow = Models.Document & {
  name: string;
  key: string;
  description?: string | null;
  workspaceId: string;
  spaceId?: string | null;
  isDefault: boolean;
  isArchived: boolean;
};

// ===================================
// Workflow Status (Simplified - NO category, NO customColumnId)
// ===================================
export type WorkflowStatus = Models.Document & {
  workflowId: string;
  name: string;
  key: string;
  icon: string;              // Lucide icon name (e.g., "Bug", "Circle", "CheckCircle")
  color: string;
  statusType: StatusType;    // Simple: OPEN, IN_PROGRESS, or CLOSED (for analytics)
  description?: string | null;
  position: number;
  positionX: number;
  positionY: number;
  isInitial: boolean;
  isFinal: boolean;
};

// ===================================
// Workflow Transition (Enhanced with Team-Based Rules)
// ===================================
export type WorkflowTransition = Models.Document & {
  workflowId: string;
  fromStatusId: string;
  toStatusId: string;
  name?: string | null;
  description?: string | null;
  
  // Team-based access control
  allowedTeamIds?: string[] | null;     // Which teams can make this transition (empty = all)
  allowedMemberRoles?: string[] | null; // Which member roles can make this transition (ADMIN, MEMBER)
  
  // Approval workflow
  requiresApproval?: boolean;           // Does this transition need approval?
  approverTeamIds?: string[] | null;    // Which teams can approve this transition
  
  // Automation
  autoTransition?: boolean;             // Auto-transition when conditions are met
  conditions?: TransitionCondition | null; // Conditions for auto-transition
};

// ===================================
// Transition Conditions (for automation)
// ===================================
export type TransitionCondition = {
  type: "ALL_SUBTASKS_DONE" | "APPROVAL_RECEIVED" | "CUSTOM";
  customLogic?: string; // For future extensibility
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
  allowedTeams?: { $id: string; name: string }[];
  approverTeams?: { $id: string; name: string }[];
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
  icon: string;
  color: string;
  statusType: StatusType;
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
  allowedTeamIds?: string[] | null;
  allowedMemberRoles?: string[] | null;
  requiresApproval?: boolean;
  approverTeamIds?: string[] | null;
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
  icon: string;
  color: string;
  statusType: StatusType;
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
  allowedTeamIds?: string[];
  requiresApproval?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  key: string;
  description: string;
  templateIcon: string;
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
    templateIcon: "Code",
    statuses: [
      { name: "To Do", key: "TODO", icon: "Circle", statusType: StatusType.OPEN, color: "#6B7280", position: 0, positionX: 50, positionY: 200, isInitial: true, isFinal: false },
      { name: "Assigned", key: "ASSIGNED", icon: "UserCheck", statusType: StatusType.OPEN, color: "#F59E0B", position: 1, positionX: 250, positionY: 200, isInitial: false, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", icon: "Clock", statusType: StatusType.IN_PROGRESS, color: "#3B82F6", position: 2, positionX: 450, positionY: 80, isInitial: false, isFinal: false },
      { name: "In Review", key: "IN_REVIEW", icon: "Eye", statusType: StatusType.IN_PROGRESS, color: "#8B5CF6", position: 3, positionX: 450, positionY: 320, isInitial: false, isFinal: false },
      { name: "Done", key: "DONE", icon: "CheckCircle", statusType: StatusType.CLOSED, color: "#10B981", position: 4, positionX: 700, positionY: 200, isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "TODO", to: "ASSIGNED", name: "Assign" },
      { from: "ASSIGNED", to: "IN_PROGRESS", name: "Start Work" },
      { from: "ASSIGNED", to: "IN_REVIEW", name: "Request Review" },
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
    templateIcon: "Columns3",
    statuses: [
      { name: "Backlog", key: "BACKLOG", icon: "CircleDashed", statusType: StatusType.OPEN, color: "#9CA3AF", position: 0, positionX: 50, positionY: 150, isInitial: true, isFinal: false },
      { name: "To Do", key: "TODO", icon: "Circle", statusType: StatusType.OPEN, color: "#F59E0B", position: 1, positionX: 280, positionY: 150, isInitial: false, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", icon: "Clock", statusType: StatusType.IN_PROGRESS, color: "#3B82F6", position: 2, positionX: 510, positionY: 150, isInitial: false, isFinal: false },
      { name: "Done", key: "DONE", icon: "CheckCircle", statusType: StatusType.CLOSED, color: "#10B981", position: 3, positionX: 740, positionY: 150, isInitial: false, isFinal: true },
    ],
    transitions: "ALL",
  },
  {
    id: "bug-tracking",
    name: "Bug Tracking",
    key: "BUG_TRACKING",
    description: "Track bugs from report to resolution",
    templateIcon: "Bug",
    statuses: [
      { name: "Open", key: "OPEN", icon: "Bug", statusType: StatusType.OPEN, color: "#EF4444", position: 0, positionX: 50, positionY: 200, isInitial: true, isFinal: false },
      { name: "Confirmed", key: "CONFIRMED", icon: "AlertCircle", statusType: StatusType.OPEN, color: "#F59E0B", position: 1, positionX: 280, positionY: 80, isInitial: false, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", icon: "Clock", statusType: StatusType.IN_PROGRESS, color: "#3B82F6", position: 2, positionX: 280, positionY: 320, isInitial: false, isFinal: false },
      { name: "Fixed", key: "FIXED", icon: "CheckSquare", statusType: StatusType.IN_PROGRESS, color: "#8B5CF6", position: 3, positionX: 510, positionY: 200, isInitial: false, isFinal: false },
      { name: "Verified", key: "VERIFIED", icon: "ShieldCheck", statusType: StatusType.CLOSED, color: "#10B981", position: 4, positionX: 740, positionY: 80, isInitial: false, isFinal: true },
      { name: "Closed", key: "CLOSED", icon: "CheckCircle", statusType: StatusType.CLOSED, color: "#6B7280", position: 5, positionX: 740, positionY: 320, isInitial: false, isFinal: true },
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
    templateIcon: "Zap",
    statuses: [
      { name: "Backlog", key: "BACKLOG", icon: "CircleDashed", statusType: StatusType.OPEN, color: "#9CA3AF", position: 0, positionX: 50, positionY: 200, isInitial: true, isFinal: false },
      { name: "Selected", key: "SELECTED", icon: "Star", statusType: StatusType.OPEN, color: "#F59E0B", position: 1, positionX: 250, positionY: 200, isInitial: false, isFinal: false },
      { name: "In Progress", key: "IN_PROGRESS", icon: "Clock", statusType: StatusType.IN_PROGRESS, color: "#3B82F6", position: 2, positionX: 450, positionY: 80, isInitial: false, isFinal: false },
      { name: "Blocked", key: "BLOCKED", icon: "Ban", statusType: StatusType.IN_PROGRESS, color: "#EF4444", position: 3, positionX: 450, positionY: 320, isInitial: false, isFinal: false },
      { name: "Review", key: "REVIEW", icon: "Eye", statusType: StatusType.IN_PROGRESS, color: "#8B5CF6", position: 4, positionX: 650, positionY: 200, isInitial: false, isFinal: false },
      { name: "Done", key: "DONE", icon: "CheckCircle", statusType: StatusType.CLOSED, color: "#10B981", position: 5, positionX: 850, positionY: 200, isInitial: false, isFinal: true },
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
      icon: status.icon,
      color: status.color,
      statusType: status.statusType,
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
      allowedTeamIds: transition.allowedTeamIds,
      allowedMemberRoles: transition.allowedMemberRoles,
      requiresApproval: transition.requiresApproval,
      approverTeamIds: transition.approverTeamIds,
      onEdit,
      onDelete,
    },
  }));
}

// ===================================
// Migration helper: Convert old category to new statusType
// ===================================
export function categoryToStatusType(category: string): StatusType {
  switch (category) {
    case "TODO":
    case "ASSIGNED":
    case "CUSTOM":
      return StatusType.OPEN;
    case "IN_PROGRESS":
    case "IN_REVIEW":
      return StatusType.IN_PROGRESS;
    case "DONE":
      return StatusType.CLOSED;
    default:
      return StatusType.OPEN;
  }
}

// ===================================
// Migration helper: Get default icon for old category
// ===================================
export function categoryToIcon(category: string): string {
  switch (category) {
    case "TODO":
      return "Circle";
    case "ASSIGNED":
      return "UserCheck";
    case "IN_PROGRESS":
      return "Clock";
    case "IN_REVIEW":
      return "Eye";
    case "DONE":
      return "CheckCircle";
    case "CUSTOM":
      return "Sparkles";
    default:
      return "Circle";
  }
}

// Legacy exports for backwards compatibility
export const DEFAULT_SOFTWARE_WORKFLOW = WORKFLOW_TEMPLATES[0];
export const DEFAULT_KANBAN_WORKFLOW = WORKFLOW_TEMPLATES[1];
export const DEFAULT_BUG_TRACKING_WORKFLOW = WORKFLOW_TEMPLATES[2];
