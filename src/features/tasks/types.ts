import { Models } from "node-appwrite";

export enum TaskStatus {
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED",
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

export type TaskAssignee = {
  $id: string;
  name: string;
  email?: string;
  profileImageUrl?: string | null;
};

export type PopulatedTask = Task & {
  assignee?: TaskAssignee;
  assignees?: TaskAssignee[]; // New field for multiple assignees
  project?: { $id: string; name: string; imageUrl: string };
};
