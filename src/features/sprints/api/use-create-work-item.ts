import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api)["work-items"]["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api)["work-items"]["$post"]>["json"];

export const useCreateWorkItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api["work-items"].$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create work item");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Work item created successfully");
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["sprint", data.sprintId] });
    },
    onError: () => {
      toast.error("Failed to create work item");
    },
  });

  return mutation;
};
