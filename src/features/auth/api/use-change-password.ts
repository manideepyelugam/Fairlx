import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.auth)["change-password"]["$patch"]
>;
type RequestType = InferRequestType<
  (typeof client.api.auth)["change-password"]["$patch"]
>;

export const useChangePassword = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth["change-password"].$patch({ json });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((errorData as { error?: string }).error || "Failed to change password");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        toast.success('message' in data && data.message ? String(data.message) : "Password changed successfully!");
      } else if ('error' in data && data.error) {
        toast.error(String(data.error));
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  return mutation;
};