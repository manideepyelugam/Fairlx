import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<
  (typeof client.api.auth.register)["$post"]
>;
type RequestType = InferRequestType<(typeof client.api.auth.register)["$post"]>;

export const useRegister = (returnUrl?: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.register.$post({ json });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      return await response.json();
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        toast.success('message' in data && data.message ? String(data.message) : "Registration successful! Please check your email to verify your account.");
        // Store returnUrl in sessionStorage for after email verification
        if (returnUrl) {
          sessionStorage.setItem('postVerificationReturnUrl', returnUrl);
        }
        router.push("/verify-email-sent");
      } else if ('error' in data && data.error) {
        toast.error(String(data.error));
      }
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
    onError: (error) => {
      try {
        const errorData = JSON.parse(error.message);
        if ('smtpError' in errorData && errorData.smtpError) {
          toast.error("Account created but verification email could not be sent. Please contact support.");
        } else if ('error' in errorData) {
          toast.error(String(errorData.error));
        } else {
          toast.error("Failed to sign up.");
        }
      } catch {
        toast.error("Failed to sign up.");
      }
    },
  });

  return mutation;
};
