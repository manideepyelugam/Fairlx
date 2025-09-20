import { Models } from "node-appwrite";

export type CustomColumn = Models.Document & {
  name: string;
  workspaceId: string;
  projectId: string;
  icon: string;
  color: string;
  position: number;
};
