import { Models } from "node-appwrite";

// ===============================
// DEPARTMENT TYPES
// ===============================

/**
 * Department - Organizational grouping unit
 * 
 * RULES:
 * - Departments belong to an organization (org-level)
 * - Users can belong to multiple departments
 * - Departments do NOT grant permissions
 * - Departments are metadata for grouping, analytics, reporting
 * 
 * USE CASES:
 * - Filter org members by department
 * - Department-level analytics
 * - Organizational hierarchy display
 */
export type Department = Models.Document & {
    /** Organization this department belongs to */
    organizationId: string;
    /** Department name (e.g., "Engineering", "Marketing") */
    name: string;
    /** Optional description */
    description?: string;
    /** Color for UI display (hex) */
    color?: string;
    /** User who created the department */
    createdBy: string;
};

/**
 * OrgMemberDepartment - Junction table for many-to-many relationship
 * 
 * Allows org members to belong to multiple departments
 */
export type OrgMemberDepartment = Models.Document & {
    /** Reference to org_members.$id */
    orgMemberId: string;
    /** Reference to departments.$id */
    departmentId: string;
};

// ===============================
// DTOs
// ===============================

export type CreateDepartmentDto = {
    name: string;
    description?: string;
    color?: string;
};

export type UpdateDepartmentDto = {
    name?: string;
    description?: string;
    color?: string;
};

export type AssignMemberToDepartmentDto = {
    orgMemberId: string;
};

// ===============================
// POPULATED TYPES
// ===============================

export type PopulatedDepartment = Department & {
    memberCount?: number;
};

export type DepartmentWithMembers = Department & {
    members: {
        $id: string;
        orgMemberId: string;
        name: string;
        email: string;
        profileImageUrl?: string | null;
    }[];
};

// ===============================
// PREDEFINED DEPARTMENT COLORS
// ===============================

export const DEPARTMENT_COLORS = [
    "#4F46E5", // Indigo
    "#0EA5E9", // Sky blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#6366F1", // Purple
] as const;
