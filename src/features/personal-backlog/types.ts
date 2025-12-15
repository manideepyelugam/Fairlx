import { Models } from "node-appwrite";

export enum BacklogItemType {
  STORY = "STORY",
  BUG = "BUG",
  TASK = "TASK",
  EPIC = "EPIC",
  SUBTASK = "SUBTASK",
  IDEA = "IDEA",
  IMPROVEMENT = "IMPROVEMENT",
}

export enum BacklogItemPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum BacklogItemStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export type BacklogItem = Models.Document & {
  title: string;
  description?: string | null;
  userId: string;
  workspaceId: string;
  priority: BacklogItemPriority;
  status: BacklogItemStatus;
  type: BacklogItemType;
  position: number;
  labels?: string[];
  dueDate?: string;
  estimatedHours?: number;
  flagged: boolean;
};
