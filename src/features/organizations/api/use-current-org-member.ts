"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrent } from "@/features/auth/api/use-current";
import { OrganizationRole } from "../types";

interface UseCurrentOrgMemberProps {
    organizationId: string;
}

export interface CurrentOrgMember {
    $id: string;
    organizationId: string;
    userId: string;
    role: OrganizationRole;
    name?: string;
    email?: string;
}

/**
 * Get the current user's membership and role in an organization
 * 
 * Returns:
 * - role: OWNER | ADMIN | MEMBER
 * - isOwner: true if OWNER
 * 
 * @deprecated canEdit, canAssignToWorkspaces - Use useCurrentUserOrgPermissions.hasPermission() instead
 */
export const useCurrentOrgMember = ({ organizationId }: UseCurrentOrgMemberProps) => {
    const { data: user } = useCurrent();

    const query = useQuery({
        queryKey: ["current-org-member", organizationId, user?.$id],
        queryFn: async () => {
            if (!user?.$id) return null;

            const response = await fetch(
                `/api/organizations/${organizationId}/members`,
                { credentials: "include" }
            );

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            const members = data.data?.documents || [];

            // Find current user's membership
            const membership = members.find(
                (m: CurrentOrgMember) => m.userId === user.$id
            );

            return membership || null;
        },
        enabled: !!organizationId && !!user?.$id,
    });

    const role = query.data?.role || null;

    return {
        ...query,
        role,
        /**
         * @deprecated Use useCurrentUserOrgPermissions.hasPermission(OrgPermissionKey.SETTINGS_MANAGE) instead
         */
        canEdit: role === "OWNER" || role === "ADMIN",
        /**
         * @deprecated Use useCurrentUserOrgPermissions.hasPermission(OrgPermissionKey.WORKSPACE_ASSIGN) instead
         */
        canAssignToWorkspaces: role === "OWNER" || role === "ADMIN" || role === "MODERATOR",
        isOwner: role === "OWNER",
        isAdmin: role === "ADMIN",
        isModerator: role === "MODERATOR",
        isMember: role === "MEMBER",
    };
};
