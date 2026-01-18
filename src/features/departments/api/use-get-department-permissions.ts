"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface DepartmentPermission {
    $id: string;
    departmentId: string;
    permissionKey: string;
    grantedBy: string;
    grantedAt: string;
}

interface DepartmentPermissionsResponse {
    data: {
        documents: DepartmentPermission[];
        total: number;
    };
}

const EMPTY_PERMISSIONS: DepartmentPermission[] = [];

/**
 * Hook to get permissions for a department
 */
export const useGetDepartmentPermissions = ({
    orgId,
    departmentId
}: {
    orgId: string;
    departmentId: string;
}) => {
    const query = useQuery<DepartmentPermissionsResponse>({
        queryKey: ["department-permissions", orgId, departmentId],
        queryFn: async () => {
            const response = await client.api.departments[":orgId"][":departmentId"]["permissions"].$get({
                param: { orgId, departmentId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch department permissions");
            }

            return await response.json() as DepartmentPermissionsResponse;
        },
        enabled: !!orgId && !!departmentId,
    });

    return {
        data: query.data?.data?.documents ?? EMPTY_PERMISSIONS,
        total: query.data?.data?.total ?? 0,
        isLoading: query.isLoading,
        error: query.error,
    };
};
