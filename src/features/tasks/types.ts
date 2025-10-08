import { Models } from "node-appwrite";

export enum TaskStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export type Task = Models.Document & {
  name: string;
  status: TaskStatus | string; // Allow custom column IDs as status
  workspaceId: string;
  assigneeId: string; // Keep for backward compatibility
  assigneeIds?: string[]; // New field for multiple assignees
  projectId: string;
  position: number;
  dueDate: string;
  endDate?: string;
  description?: string | null;
  estimatedHours?: number;
  priority?: TaskPriority;
  labels?: string[];
};

export type PopulatedTask = Task & {
  assignee?: { $id: string; name: string };
  assignees?: { $id: string; name: string }[]; // New field for multiple assignees
  project?: { $id: string; name: string; imageUrl: string };
};
