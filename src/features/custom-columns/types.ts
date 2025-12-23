import { Models } from "node-appwrite";

export type CustomColumn = Models.Document & {
  name: string;
  workspaceId: string;
  projectId?: string;      // Optional - used when creating custom columns for projects
  workflowId?: string;     // Optional - used when creating custom columns for workflows
  icon: string;
  color: string;
  position: number;
};
