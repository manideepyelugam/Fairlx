import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/rpc";

interface UseGetDefaultColumnSettingsProps {
  workspaceId: string;
}

export type ResponseType = InferResponseType<typeof client.api["default-column-settings"]["$get"]>;

export const useGetDefaultColumnSettings = ({
  workspaceId,
}: UseGetDefaultColumnSettingsProps) => {
  const query = useQuery({
    enabled: !!workspaceId,
    queryKey: ["default-column-settings", workspaceId],
    queryFn: async () => {
      const response = await client.api["default-column-settings"]["$get"]({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch default column settings");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
