import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetCustomColumnsProps {
  workspaceId: string;
}

export const useGetCustomColumns = ({ workspaceId }: UseGetCustomColumnsProps) => {
  const query = useQuery({
    queryKey: ["custom-columns", workspaceId],
    queryFn: async () => {
      const response = await client.api["custom-columns"]["$get"]({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch custom columns");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
