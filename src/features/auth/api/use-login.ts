import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<(typeof client.api.auth.login)["$post"]>;
type RequestType = InferRequestType<(typeof client.api.auth.login)["$post"]>;

/**
 * Login hook with unified post-auth routing
 * 
 * After successful login, redirects to /auth/callback which handles:
 * - Checking if user needs onboarding
 * - Routing to appropriate workspace/organization
 * - Same routing logic for all auth methods
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useLogin = (returnUrl?: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.login.$post({ json });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return await response.json();
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        toast.success("Logged in.");
        queryClient.invalidateQueries({ queryKey: ["current"] });

        // Redirect to unified callback for post-auth routing
        router.push("/auth/callback");
      }
    },
    onError: (error: { needsVerification?: boolean; error?: string; email?: string } | Error) => {
      if ('needsVerification' in error && error.needsVerification) {
        toast.error(error.error || "Email verification required");
        // Create a more comprehensive verification page URL with user info
        router.push(`/verify-email-needed?email=${encodeURIComponent(error.email || '')}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : (error.error || "Failed to log in.");
        toast.error(errorMessage);
      }
    },
  });

  return mutation;
};
