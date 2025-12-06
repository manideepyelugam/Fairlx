import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetSpaceProps {
  spaceId: string;
}

export const useGetSpace = ({ spaceId }: UseGetSpaceProps) => {
  const query = useQuery({
    queryKey: ["space", spaceId],
    enabled: !!spaceId,
    queryFn: async () => {
      const response = await client.api.spaces[":spaceId"].$get({
        param: { spaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch space.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
