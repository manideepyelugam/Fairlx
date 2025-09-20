import { TaskStatus } from "@/features/tasks/types";

export interface DefaultColumnSetting {
  $id: string;
  workspaceId: string;
  projectId: string;
  columnId: TaskStatus;
  isEnabled: boolean;
  position?: number;
  $createdAt: string;
  $updatedAt: string;
}
