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
 * - Organization ADMIN can manage workspaces and members
 * - Organization MEMBER has view access to org-level resources
 * 
 * INVARIANT: Organization must always have ≥1 OWNER
 */
export enum OrganizationRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
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
};

export type OrganizationMember = Models.Document & {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
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
