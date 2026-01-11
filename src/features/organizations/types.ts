import { Models } from "node-appwrite";

// ===============================
// Account Types (User Identity Level)
// ===============================

/**
 * Account Type determines the billing and workspace behavior
 * 
 * WHY: This is stored explicitly on users (not inferred) because:
 * - Account type is identity-level, not authorization
 * - Prevents ambiguous state during conversion
 * - Enables deterministic billing scope
 * - Required for one-way PERSONAL → ORG conversion rule
 */
export enum AccountType {
    PERSONAL = "PERSONAL",
    ORG = "ORG",
}

// ===============================
// Organization Roles
// ===============================

/**
 * Organization-level roles
 * 
 * WHY separate from workspace roles:
 * - Organization OWNER controls billing and org deletion
 * - Organization ADMIN can invite/remove org members, create workspaces
 * - Organization MODERATOR can assign org members to workspaces
 * - Organization MEMBER has no org-level management permissions
 * 
 * RULE: Org role defines WHAT you can manage globally.
 *       Workspace role defines WHERE you can act.
 *       Org role NEVER implies workspace access.
 * 
 * INVARIANT: Organization must always have ≥1 OWNER
 */
export enum OrganizationRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR",
    MEMBER = "MEMBER",
}

/**
 * Organization member status
 * 
 * INVITED: User has been invited but not yet accepted
 * ACTIVE: User has accepted and is an active member
 * SUSPENDED: User's access has been suspended (can be reactivated)
 */
export enum OrgMemberStatus {
    INVITED = "INVITED",
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
}

// ===============================
// Database Document Types
// ===============================

export type Organization = Models.Document & {
    name: string;
    imageUrl?: string;
    /**
     * JSON string containing billing settings
     * e.g., { paymentMethodId, billingEmail, etc. }
     */
    billingSettings?: string;
    /**
     * User ID who created the organization.
     * This user becomes the initial OWNER.
     */
    createdBy: string;
    /**
     * Timestamp when billing started for this organization.
     * Used for PERSONAL → ORG conversion to determine:
     * - usage.timestamp < billingStartAt → bill to user
     * - usage.timestamp >= billingStartAt → bill to org
     */
    billingStartAt?: string;
    /**
     * Soft-delete timestamp. When set, organization is considered deleted.
     * Data is retained for gracePeriodDays (default 30) before permanent removal.
     * 
     * WHY soft-delete: Prevents accidental data loss and enables recovery.
     * Also required for compliance/audit trail.
     */
    deletedAt?: string;
    /**
     * User ID who initiated the soft-delete.
     * Required for audit trail.
     */
    deletedBy?: string;
    /**
     * Timestamp when billing was frozen.
     * Set immediately on soft-delete to prevent further charges.
     * 
     * WHY separate from deletedAt: Billing freeze may happen before
     * final deletion (e.g., payment failure scenarios).
     */
    billingFrozenAt?: string;
};

export type OrganizationMember = Models.Document & {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
    /**
     * Member status for invitation lifecycle
     * - INVITED: Pending acceptance
     * - ACTIVE: Full access
     * - SUSPENDED: Temporarily disabled
     */
    status: OrgMemberStatus;
    /**
     * If true, user must reset password on first login.
     * Set when admin creates user with temp password.
     * Cleared after successful password reset.
     */
    mustResetPassword?: boolean;
    /**
     * Cached user data for display (denormalized)
     * Updated when membership is created/modified
     */
    name?: string;
    email?: string;
    profileImageUrl?: string | null;
};

// ===============================
// DTO Types for API
// ===============================

export type CreateOrganizationDto = {
    name: string;
    imageUrl?: string;
};

export type UpdateOrganizationDto = {
    name?: string;
    imageUrl?: string;
    billingSettings?: string;
};

export type AddOrganizationMemberDto = {
    userId: string;
    role: OrganizationRole;
};

export type UpdateOrganizationMemberDto = {
    role: OrganizationRole;
};

/**
 * Create a new org member (admin creates user account)
 * Used for ORG accounts only - creates Appwrite user + org membership
 */
export type CreateOrgMemberDto = {
    fullName: string;
    email: string;
    role: OrganizationRole;
};

/**
 * Personal → Organization Conversion Request
 * 
 * WHY atomic: This operation must succeed completely or not at all.
 * Partial conversion would leave the system in an inconsistent state.
 */
export type ConvertToOrganizationDto = {
    organizationName: string;
};

// ===============================
// Response Types
// ===============================

export type PopulatedOrganization = Organization & {
    memberCount?: number;
    workspaceCount?: number;
};
