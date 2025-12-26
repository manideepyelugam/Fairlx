"use client";

import { useQuery } from "@tanstack/react-query";

interface UseGetOrgAuditLogsProps {
    organizationId: string;
    limit?: number;
    offset?: number;
    actionType?: string;
}

export const useGetOrgAuditLogs = ({
    organizationId,
    limit = 50,
    offset = 0,
    actionType,
}: UseGetOrgAuditLogsProps) => {
    return useQuery({
        queryKey: ["org-audit-logs", organizationId, limit, offset, actionType],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
            });
            if (actionType) {
                params.set("actionType", actionType);
            }

            const response = await fetch(
                `/api/organizations/${organizationId}/audit-logs?${params.toString()}`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch audit logs");
            }

            return response.json();
        },
        enabled: !!organizationId,
    });
};

