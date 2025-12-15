import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetSpaceMembersProps {
  spaceId: string;
}

export const useGetSpaceMembers = ({ spaceId }: UseGetSpaceMembersProps) => {
  const query = useQuery({
    queryKey: ["space-members", spaceId],
    enabled: !!spaceId,
    queryFn: async () => {
      const response = await client.api.spaces[":spaceId"]["members"].$get({
        param: { spaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch space members.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
