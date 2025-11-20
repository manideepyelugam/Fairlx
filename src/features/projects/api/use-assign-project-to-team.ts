import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.projects)[":projectId"]["teams"][":teamId"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.projects)[":projectId"]["teams"][":teamId"]["$post"]
>;

export const useAssignProjectToTeam = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.projects[":projectId"]["teams"][
        ":teamId"
      ]["$post"]({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to assign project to team");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Project assigned to team");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["team-projects"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign project to team");
    },
  });

  return mutation;
};
