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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      return await response.json();
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        toast.success('message' in data && data.message ? String(data.message) : "Recovery email sent!");
      } else if ('error' in data && data.error) {
        toast.error(String(data.error));
      }
    },
    onError: (error) => {
      try {
        const errorData = JSON.parse(error.message);
        if ('smtpError' in errorData && errorData.smtpError) {
          toast.error("Email service is not configured. Please contact support.");
        } else if ('error' in errorData) {
          toast.error(String(errorData.error));
        } else {
          toast.error("Failed to send recovery email.");
        }
      } catch {
        toast.error("Failed to send recovery email.");
      }
    },
  });

  return mutation;
};