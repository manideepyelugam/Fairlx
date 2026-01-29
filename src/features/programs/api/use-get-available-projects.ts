import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetAvailableProjectsProps {
  programId: string;
}

interface AvailableProject {
  $id: string;
  name: string;
  key: string;
  imageUrl?: string;
  isLinked: boolean;
}

interface GetAvailableProjectsResponse {
  data: {
    documents: AvailableProject[];
    total: number;
  };
}

export type { GetAvailableProjectsResponse, AvailableProject };

export const useGetAvailableProjects = ({ programId }: UseGetAvailableProjectsProps) => {
  const query = useQuery({
    queryKey: ["program-available-projects", programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<GetAvailableProjectsResponse> => {
      if (!programId) {
        throw new Error("Program ID is required");
      }

      const response = await client.api.programs[":programId"].projects.available.$get({
        param: { programId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch available projects");
      }

      return await response.json();
    },
  });

  return query;
};
