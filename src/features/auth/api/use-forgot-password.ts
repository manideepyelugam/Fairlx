import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.auth)["forgot-password"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.auth)["forgot-password"]["$post"]
>;

export const useForgotPassword = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth["forgot-password"].$post({ json });
      return await response.json();
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        toast.success('message' in data && data.message ? String(data.message) : "Recovery email sent!");
      } else if ('error' in data && data.error) {
        toast.error(String(data.error));
      }
    },
    onError: () => {
      toast.error("Failed to send recovery email.");
    },
  });

  return mutation;
};