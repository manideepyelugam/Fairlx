import { Models } from "node-appwrite";

/**
 * Workspace member roles
 * 
 * WHY OWNER is separate from ADMIN:
 * - OWNER can delete workspace, transfer ownership, manage billing
 * - ADMIN can manage members and settings
 * - MEMBER can view and contribute
 * 
 * INVARIANT: Every workspace must have exactly ≥1 OWNER
 */
export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export type Member = Models.Document & {
  workspaceId: string;
  userId: string;
  role: MemberRole | string;
  name?: string;
  email?: string;
  profileImageUrl?: string | null;
};
