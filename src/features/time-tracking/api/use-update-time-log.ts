import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.timeLogs)[":timeLogId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.timeLogs)[":timeLogId"]["$patch"]
>;

export const useUpdateTimeLog = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.timeLogs[":timeLogId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update time log.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Time log updated.");
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["timesheet"] });
      queryClient.invalidateQueries({ queryKey: ["estimates-vs-actuals"] });
      queryClient.invalidateQueries({ queryKey: ["time-log", data.$id] });
    },
    onError: () => {
      toast.error("Failed to update time log.");
    },
  });

  return mutation;
};
