import { Models } from "node-appwrite";

export type CustomColumn = Models.Document & {
  name: string;
  workspaceId: string;
  icon: string;
  color: string;
  position: number;
};
