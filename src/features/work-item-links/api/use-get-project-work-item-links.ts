import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export interface UseGetProjectWorkItemLinksProps {
  projectId: string;
}

export const useGetProjectWorkItemLinks = ({ projectId }: UseGetProjectWorkItemLinksProps) => {
  const query = useQuery({
    queryKey: ["work-item-links", "project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await client.api["work-item-links"]["project"].$get({
        query: { projectId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch project work item links.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
