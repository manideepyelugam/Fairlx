import { Models } from "node-appwrite";

// Board type determines sprint behavior
export enum BoardType {
  SCRUM = "SCRUM",     // Sprint-based, Kanban locked without active sprint
  KANBAN = "KANBAN",   // Pure Kanban, no sprint dependency
  HYBRID = "HYBRID",   // Both sprints and free Kanban flow
}

// Project status
export enum ProjectStatus {
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export type Project = Models.Document & {
  name: string;
  description?: string;
  imageUrl: string;
  workspaceId: string;
  spaceId?: string;                     // NEW: Link to Space (optional for backward compat)
  deadline?: string;
  assignedTeamIds?: string[];           // Teams that can access this project

  // Board configuration
  boardType: BoardType;                 // NEW: Scrum, Kanban, or Hybrid
  key?: string;                         // NEW: Project key for work item prefixes (e.g., "WEB")
  status?: ProjectStatus;               // NEW: Project status

  // Workflow configuration
  workflowId?: string;                  // NEW: Custom workflow for this project (overrides space default)

  // Settings
  defaultAssigneeId?: string;           // NEW: Default assignee for new work items
  autoAssignToCreator?: boolean;        // NEW: Auto-assign to item creator
  enableTimeTracking?: boolean;         // NEW: Enable time tracking for this project

  // Kanban settings
  wipLimits?: Record<string, number>;   // NEW: WIP limits per column/status { "IN_PROGRESS": 5 }
  defaultSwimlane?: string;             // NEW: Default swimlane grouping ("assignee", "epic", "type", "none")

  // Sprint settings (for SCRUM/HYBRID boards)
  defaultSprintDuration?: number;       // NEW: Default sprint duration in days (e.g., 14)
  sprintStartDay?: number;              // NEW: Day of week sprints typically start (0=Sun, 1=Mon, etc.)

  // UI settings
  color?: string;                       // NEW: Project color theme
  position?: number;                    // NEW: Order in project list
  // Custom Definitions
  customWorkItemTypes?: {
    key: string;
    label: string;
    icon: string;
    color: string;
  }[];
  customPriorities?: {
    key: string;
    label: string;
    color: string;
    level: number;
  }[];
  customLabels?: {
    name: string;
    color: string;
  }[];
};

// Kanban board state (computed, not stored)
export type KanbanBoardState = {
  locked: boolean;
  reason?: "NO_ACTIVE_SPRINT" | "NO_PERMISSION" | null;
  activeSprint?: {
    $id: string;
    name: string;
    endDate?: string;
  } | null;
  message?: string;
};

// Populated project with computed fields
export type PopulatedProject = Project & {
  space?: {
    $id: string;
    name: string;
    key: string;
  } | null;
  workflow?: {
    $id: string;
    name: string;
  } | null;
  workItemCount?: number;
  completedWorkItemCount?: number;
  activeSprintCount?: number;
  memberCount?: number;
  kanbanState?: KanbanBoardState;
};
