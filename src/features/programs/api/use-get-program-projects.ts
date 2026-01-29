import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LinkedProject } from "../types";

interface UseGetProgramProjectsProps {
  programId: string;
}

interface GetProgramProjectsResponse {
  data: {
    documents: LinkedProject[];
    total: number;
  };
}

export type { GetProgramProjectsResponse };

export const useGetProgramProjects = ({ programId }: UseGetProgramProjectsProps) => {
  const query = useQuery({
    queryKey: ["program-projects", programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<GetProgramProjectsResponse> => {
      if (!programId) {
        throw new Error("Program ID is required");
      }

      const response = await client.api.programs[":programId"].projects.$get({
        param: { programId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program projects");
      }

      return await response.json();
    },
  });

  return query;
};
