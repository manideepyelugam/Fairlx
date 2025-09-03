import { TaskStatus } from "@/features/tasks/types";

export interface DefaultColumnSetting {
  $id: string;
  workspaceId: string;
  columnId: TaskStatus;
  isEnabled: boolean;
  $createdAt: string;
  $updatedAt: string;
}
