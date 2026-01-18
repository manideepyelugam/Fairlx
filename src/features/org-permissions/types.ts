import { Models } from "node-appwrite";

// ===============================
// ORG PERMISSION KEYS
// ===============================

/**
 * Granular org-level permission keys
 * 
 * RULES:
 * - Permissions are EXPLICIT (not inferred from role or department)
 * - Permissions gate screens and APIs
 * - Format: org.<category>.<action>
 * 
 * INVARIANTS:
 * - No permission inferred from department
 * - OWNER role implicitly has ALL permissions
 * - ADMIN role has management permissions by default
 * - Other roles must have explicit grants
 */
export enum OrgPermissionKey {
    // Billing
    BILLING_VIEW = "org.billing.view",
    BILLING_MANAGE = "org.billing.manage",

    // Members
    MEMBERS_VIEW = "org.members.view",
    MEMBERS_MANAGE = "org.members.manage",

    // Settings
    SETTINGS_MANAGE = "org.settings.manage",

    // Audit & Compliance
    AUDIT_VIEW = "org.audit.view",
    COMPLIANCE_VIEW = "org.compliance.view",

    // Departments
    DEPARTMENTS_MANAGE = "org.departments.manage",

    // Security
    SECURITY_VIEW = "org.security.view",

    // Workspaces
    WORKSPACE_CREATE = "org.workspace.create",
    WORKSPACE_ASSIGN = "org.workspace.assign",


}

// ===============================
// PERMISSION METADATA
// ===============================

export const ORG_PERMISSION_METADATA: Record<OrgPermissionKey, {
    label: string;
    description: string;
    category: string;
}> = {
    [OrgPermissionKey.BILLING_VIEW]: {
        label: "View Billing",
        description: "View billing information and invoices",
        category: "Billing",
    },
    [OrgPermissionKey.BILLING_MANAGE]: {
        label: "Manage Billing",
        description: "Manage payment methods and billing settings",
        category: "Billing",
    },
    [OrgPermissionKey.MEMBERS_VIEW]: {
        label: "View Members",
        description: "View organization members list",
        category: "Members",
    },
    [OrgPermissionKey.MEMBERS_MANAGE]: {
        label: "Manage Members",
        description: "Add, remove, and update member roles",
        category: "Members",
    },
    [OrgPermissionKey.SETTINGS_MANAGE]: {
        label: "Manage Settings",
        description: "Modify organization settings",
        category: "Settings",
    },
    [OrgPermissionKey.AUDIT_VIEW]: {
        label: "View Audit Logs",
        description: "View organization activity logs",
        category: "Audit",
    },
    [OrgPermissionKey.COMPLIANCE_VIEW]: {
        label: "View Compliance",
        description: "View compliance reports and status",
        category: "Audit",
    },
    [OrgPermissionKey.DEPARTMENTS_MANAGE]: {
        label: "Manage Departments",
        description: "Create, edit, and delete departments",
        category: "Departments",
    },
    [OrgPermissionKey.SECURITY_VIEW]: {
        label: "View Security",
        description: "View security settings and logs",
        category: "Security",
    },
    [OrgPermissionKey.WORKSPACE_CREATE]: {
        label: "Create Workspaces",
        description: "Create new workspaces",
        category: "Workspaces",
    },
    [OrgPermissionKey.WORKSPACE_ASSIGN]: {
        label: "Assign to Workspaces",
        description: "Assign members to workspaces",
        category: "Workspaces",
    },

};

// ===============================
// DATABASE TYPES
// ===============================

/**
 * OrgMemberPermission - Explicit permission grant
 * 
 * RULES:
 * - One record per (orgMemberId, permissionKey) pair
 * - Unique constraint on (orgMemberId, permissionKey)
 * - Tracks who granted and when for audit
 */
export type OrgMemberPermission = Models.Document & {
    /** Reference to org_members.$id */
    orgMemberId: string;
    /** Permission key from OrgPermissionKey enum */
    permissionKey: string;
    /** User ID who granted this permission */
    grantedBy: string;
    /** Timestamp when granted */
    grantedAt: string;
};

// ===============================
// DTOs
// ===============================

export type GrantPermissionDto = {
    orgMemberId: string;
    permissionKey: string;
};

export type RevokePermissionDto = {
    orgMemberId: string;
    permissionKey: string;
};

export type BulkGrantPermissionsDto = {
    orgMemberId: string;
    permissionKeys: string[];
};

// ===============================
// RESPONSE TYPES
// ===============================

export type MemberWithPermissions = {
    memberId: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
};

// ===============================
// PERMISSION CATEGORIES FOR UI
// ===============================

export const PERMISSION_CATEGORIES = [
    {
        id: "billing",
        label: "Billing & Payments",
        permissions: [
            OrgPermissionKey.BILLING_VIEW,
            OrgPermissionKey.BILLING_MANAGE,
        ],
    },
    {
        id: "members",
        label: "Member Management",
        permissions: [
            OrgPermissionKey.MEMBERS_VIEW,
            OrgPermissionKey.MEMBERS_MANAGE,
        ],
    },
    {
        id: "settings",
        label: "Organization Settings",
        permissions: [
            OrgPermissionKey.SETTINGS_MANAGE,
        ],
    },
    {
        id: "audit",
        label: "Audit & Compliance",
        permissions: [
            OrgPermissionKey.AUDIT_VIEW,
            OrgPermissionKey.COMPLIANCE_VIEW,
        ],
    },
    {
        id: "departments",
        label: "Departments",
        permissions: [
            OrgPermissionKey.DEPARTMENTS_MANAGE,
        ],
    },
    {
        id: "security",
        label: "Security",
        permissions: [
            OrgPermissionKey.SECURITY_VIEW,
        ],
    },
    {
        id: "workspaces",
        label: "Workspaces",
        permissions: [
            OrgPermissionKey.WORKSPACE_CREATE,
            OrgPermissionKey.WORKSPACE_ASSIGN,
        ],
    },

] as const;
