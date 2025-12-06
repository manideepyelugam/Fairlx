import { Models } from "node-appwrite";

export enum WorkspaceUIMode {
  SIMPLE = "SIMPLE",     // Simplified UI for small teams (hides Spaces, Programs)
  ADVANCED = "ADVANCED", // Full enterprise features
}

export type Workspace = Models.Document & {
  name: string;
  imageUrl: string;
  inviteCode: string;
  userId: string;
  uiMode?: WorkspaceUIMode;  // UI complexity mode
  enabledFeatures?: {
    spaces?: boolean;
    programs?: boolean;
    teams?: boolean;
    customFields?: boolean;
    workflows?: boolean;
    timeTracking?: boolean;
  };
};
