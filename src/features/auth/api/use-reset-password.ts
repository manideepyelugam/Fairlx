import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.auth)["reset-password"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.auth)["reset-password"]["$post"]
>;

export const useResetPassword = () => {
  const router = useRouter();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth["reset-password"].$post({ json });
      return await response.json();
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        toast.success('message' in data && data.message ? String(data.message) : "Password reset successfully!");
        router.push("/sign-in");
      } else if ('error' in data && data.error) {
        toast.error(String(data.error));
      }
    },
    onError: () => {
      toast.error("Failed to reset password.");
    },
  });

  return mutation;
};