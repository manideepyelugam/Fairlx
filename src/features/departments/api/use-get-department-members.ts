"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface DepartmentMember {
    $id: string;
    name: string;
    email: string;
    profileImageUrl?: string | null;
}

interface DepartmentMembersResponse {
    data: {
        documents: DepartmentMember[];
        total: number;
    };
}

/**
 * Hook to get members in a department
 */
export const useGetDepartmentMembers = ({
    orgId,
    departmentId
}: {
    orgId: string;
    departmentId: string;
}) => {
    const query = useQuery<DepartmentMembersResponse>({
        queryKey: ["department-members", orgId, departmentId],
        queryFn: async () => {
            const response = await client.api.departments[":orgId"][":departmentId"]["members"].$get({
                param: { orgId, departmentId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch department members");
            }

            return await response.json() as unknown as DepartmentMembersResponse;
        },
        enabled: !!orgId && !!departmentId,
    });

    return {
        data: query.data?.data?.documents ?? [],
        total: query.data?.data?.total ?? 0,
        isLoading: query.isLoading,
        error: query.error,
    };
};
