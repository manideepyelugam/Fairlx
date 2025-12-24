import { Models } from "node-appwrite";

export enum WorkspaceUIMode {
  SIMPLE = "SIMPLE",     // Simplified UI for small teams (hides Spaces, Programs)
  ADVANCED = "ADVANCED", // Full enterprise features
}

/**
 * Billing scope determines where usage costs are attributed
 * 
 * WHY: During PERSONAL → ORG conversion, we need to know
 * whether to bill the user or the organization.
 */
export type BillingScope = "user" | "organization";

export type Workspace = Models.Document & {
  name: string;
  imageUrl: string;
  inviteCode: string;
  userId: string;
  /**
   * Organization ID this workspace belongs to.
   * NULL = PERSONAL account workspace (user owns directly)
   * SET = ORG account workspace (organization owns)
   * 
   * WHY nullable: PERSONAL accounts don't have organizations
   */
  organizationId?: string | null;
  /**
   * Is this the default workspace for the organization?
   * Created automatically on org signup/conversion.
   */
  isDefault?: boolean;
  /**
   * Billing scope for usage metering.
   * - "user" → bill to workspace.userId
   * - "organization" → bill to workspace.organizationId
   * 
   * WHY explicit: Prevents billing ambiguity during conversion
   */
  billingScope?: BillingScope;
  uiMode?: WorkspaceUIMode;
  enabledFeatures?: {
    spaces?: boolean;
    programs?: boolean;
    teams?: boolean;
    customFields?: boolean;
    workflows?: boolean;
    timeTracking?: boolean;
  };
};

