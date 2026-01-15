import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetDepartmentsProps {
    orgId: string;
}

export const useGetDepartments = ({ orgId }: UseGetDepartmentsProps) => {
    const query = useQuery({
        queryKey: ["departments", orgId],
        queryFn: async () => {
            const response = await client.api.departments[":orgId"].$get({
                param: { orgId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch departments");
            }

            const { data } = await response.json();
            return data;
        },
        enabled: !!orgId,
    });

    return query;
};
