"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrent } from "@/features/auth/api/use-current";
import { OrganizationRole } from "@/features/organizations/types";
import { OrgPermissionKey } from "../types";

interface UseCurrentUserOrgPermissionsProps {
    orgId: string;
}

// Role-based default permissions
const ROLE_DEFAULT_PERMISSIONS: Record<OrganizationRole, OrgPermissionKey[]> = {
    [OrganizationRole.OWNER]: Object.values(OrgPermissionKey) as OrgPermissionKey[],
    [OrganizationRole.ADMIN]: [
        OrgPermissionKey.BILLING_VIEW,
        OrgPermissionKey.MEMBERS_VIEW,
        OrgPermissionKey.MEMBERS_MANAGE,
        OrgPermissionKey.SETTINGS_MANAGE,
        OrgPermissionKey.AUDIT_VIEW,
        OrgPermissionKey.DEPARTMENTS_MANAGE,
        OrgPermissionKey.SECURITY_VIEW,
        OrgPermissionKey.WORKSPACE_CREATE,
        OrgPermissionKey.WORKSPACE_ASSIGN,
    ],
    [OrganizationRole.MODERATOR]: [
        OrgPermissionKey.MEMBERS_VIEW,
        OrgPermissionKey.WORKSPACE_ASSIGN,
    ],
    [OrganizationRole.MEMBER]: [],
};

/**
 * Hook to get current user's org permissions based on role
 * Used for navigation visibility and screen access
 * 
 * Uses role-based defaults. For explicit per-user permissions,
 * a separate API call would be needed.
 */
export const useCurrentUserOrgPermissions = ({ orgId }: UseCurrentUserOrgPermissionsProps) => {
    const { data: user } = useCurrent();

    const query = useQuery({
        queryKey: ["current-user-org-permissions", orgId, user?.$id],
        queryFn: async (): Promise<{
            permissions: OrgPermissionKey[];
            role: OrganizationRole | null;
            isOwner: boolean;
            orgMemberId: string | null;
        }> => {
            if (!user?.$id || !orgId) {
                return { permissions: [] as OrgPermissionKey[], role: null, isOwner: false, orgMemberId: null };
            }

            // Get membership from org members endpoint
            const response = await fetch(
                `/api/organizations/${orgId}/members`,
                { credentials: "include" }
            );

            if (!response.ok) {
                return { permissions: [] as OrgPermissionKey[], role: null, isOwner: false, orgMemberId: null };
            }

            const data = await response.json();
            const members = data.data?.documents || [];

            // Find current user's membership
            const membership = members.find(
                (m: { userId: string }) => m.userId === user.$id
            );

            if (!membership) {
                return { permissions: [] as OrgPermissionKey[], role: null, isOwner: false, orgMemberId: null };
            }

            const role = membership.role as OrganizationRole;
            const isOwner = role === OrganizationRole.OWNER;

            // Get role-based permissions
            const rolePermissions = ROLE_DEFAULT_PERMISSIONS[role] || [];

            return {
                permissions: rolePermissions,
                role,
                isOwner,
                orgMemberId: membership.$id,
            };
        },
        enabled: !!orgId && !!user?.$id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const hasPermission = (permission: OrgPermissionKey): boolean => {
        if (query.data?.isOwner) return true;
        return query.data?.permissions?.includes(permission) ?? false;
    };

    return {
        ...query,
        hasPermission,
        isOwner: query.data?.isOwner ?? false,
        role: query.data?.role ?? null,
    };
};
