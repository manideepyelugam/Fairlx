import { z } from "zod";
import { OrgPermissionKey } from "./types";

const validPermissionKeys = Object.values(OrgPermissionKey);

export const grantPermissionSchema = z.object({
    orgMemberId: z.string().min(1, "Member ID is required"),
    permissionKey: z.string().refine(
        (key) => validPermissionKeys.includes(key as OrgPermissionKey),
        "Invalid permission key"
    ),
});

export const revokePermissionSchema = z.object({
    orgMemberId: z.string().min(1, "Member ID is required"),
    permissionKey: z.string().refine(
        (key) => validPermissionKeys.includes(key as OrgPermissionKey),
        "Invalid permission key"
    ),
});

export const bulkGrantPermissionsSchema = z.object({
    orgMemberId: z.string().min(1, "Member ID is required"),
    permissionKeys: z.array(
        z.string().refine(
            (key) => validPermissionKeys.includes(key as OrgPermissionKey),
            "Invalid permission key"
        )
    ).min(1, "At least one permission is required"),
});
