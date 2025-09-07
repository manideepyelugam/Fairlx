import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.timeLogs)[":timeLogId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.timeLogs)[":timeLogId"]["$delete"]
>;

export const useDeleteTimeLog = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.timeLogs[":timeLogId"].$delete({ param });

      if (!response.ok) {
        throw new Error("Failed to delete time log.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Time log deleted.");
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["timesheet"] });
      queryClient.invalidateQueries({ queryKey: ["estimates-vs-actuals"] });
      queryClient.invalidateQueries({ queryKey: ["time-log", data.$id] });
    },
    onError: () => {
      toast.error("Failed to delete time log.");
    },
  });

  return mutation;
};
