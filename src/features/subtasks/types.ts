import { Models } from "node-appwrite";

export type Subtask = Models.Document & {
  title: string;
  workItemId: string;
  workspaceId: string;
  completed: boolean;
  position: number;
  createdBy: string;
};
