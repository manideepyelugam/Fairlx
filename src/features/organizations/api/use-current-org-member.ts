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
 * - canEdit: true if OWNER or ADMIN
 * - isOwner: true if OWNER
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
        // OWNER and ADMIN can edit org settings
        canEdit: role === "OWNER" || role === "ADMIN",
        // MODERATOR+ can assign members to workspaces
        canAssignToWorkspaces: role === "OWNER" || role === "ADMIN" || role === "MODERATOR",
        isOwner: role === "OWNER",
        isAdmin: role === "ADMIN",
        isModerator: role === "MODERATOR",
        isMember: role === "MEMBER",
    };
};
