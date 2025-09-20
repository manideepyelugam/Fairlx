import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.timeLogs)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.timeLogs)["$post"]>;

export const useCreateTimeLog = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.timeLogs.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create time log.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Time log created.");
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["timesheet"] });
      queryClient.invalidateQueries({ queryKey: ["estimates-vs-actuals"] });
    },
    onError: () => {
      toast.error("Failed to create time log.");
    },
  });

  return mutation;
};
