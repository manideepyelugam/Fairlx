"use client";

import { useQuery } from "@tanstack/react-query";

interface UseGetOrgMembersProps {
    organizationId: string;
}

export interface OrgMember {
    $id: string;
    organizationId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    name?: string;
    email?: string;
    profileImageUrl?: string | null;
}

/**
 * Fetch all members of an organization
 */
export const useGetOrgMembers = ({ organizationId }: UseGetOrgMembersProps) => {
    return useQuery({
        queryKey: ["org-members", organizationId],
        queryFn: async () => {
            const response = await fetch(
                `/api/organizations/${organizationId}/members`,
                { credentials: "include" }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch organization members");
            }

            const data = await response.json();
            return data.data as { documents: OrgMember[]; total: number };
        },
        enabled: !!organizationId,
    });
};
