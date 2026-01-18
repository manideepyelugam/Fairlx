import { z } from "zod";

export const createDepartmentSchema = z.object({
    name: z.string().trim().min(1, "Department name is required").max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export const assignMemberToDepartmentSchema = z.object({
    orgMemberId: z.string().min(1, "Member ID is required"),
});

export const addDepartmentPermissionSchema = z.object({
    permissionKey: z.string().min(1, "Permission key is required"),
});

export const removeDepartmentPermissionSchema = z.object({
    permissionKey: z.string().min(1, "Permission key is required"),
});
