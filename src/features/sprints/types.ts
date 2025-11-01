import { Models } from "node-appwrite";

export enum WorkItemType {
  STORY = "STORY",
  BUG = "BUG",
  TASK = "TASK",
  EPIC = "EPIC",
  SUBTASK = "SUBTASK",
}

export enum WorkItemPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum WorkItemStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

export enum SprintStatus {
  PLANNED = "PLANNED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

export type Sprint = Models.Document & {
  name: string;
  workspaceId: string;
  projectId: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  goal?: string;
  position: number;
};

export type WorkItem = Models.Document & {
  key: string; // Unique identifier like "PROJ-123"
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  storyPoints?: number;
  workspaceId: string;
  projectId: string;
  sprintId?: string | null;
  epicId?: string | null;
  parentId?: string | null; // For subtasks
  assigneeIds: string[];
  description?: string | null;
  flagged: boolean;
  position: number;
  dueDate?: string;
  estimatedHours?: number;
  labels?: string[];
};

export type WorkItemAssignee = {
  $id: string;
  name: string;
  email?: string;
  profileImageUrl?: string | null;
};

export type PopulatedWorkItem = WorkItem & {
  assignees?: WorkItemAssignee[];
  epic?: { $id: string; key: string; title: string } | null;
  parent?: { $id: string; key: string; title: string } | null;
  childrenCount?: number;
  children?: PopulatedWorkItem[];
};

export type PopulatedSprint = Sprint & {
  workItems?: PopulatedWorkItem[];
  workItemCount?: number;
  completedPoints?: number;
  totalPoints?: number;
};
