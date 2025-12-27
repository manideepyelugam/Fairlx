import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.auth)["verify-email"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.auth)["verify-email"]["$post"]
>;

/**
 * Verify email and auto-authenticate hook
 * 
 * After successful verification:
 * - Backend creates session and sets cookie
 * - User is auto-logged in
 * - Redirects directly to onboarding/dashboard based on account type
 */
export const useVerifyEmail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth["verify-email"].$post({ json });
      return await response.json();
    },
    onSuccess: (data) => {
      if ('success' in data && data.success) {
        // Clear any stale cache before redirecting
        queryClient.clear();

        // Check if auto-authenticated
        const autoAuthenticated = 'autoAuthenticated' in data && data.autoAuthenticated;
        const accountType = 'accountType' in data ? data.accountType : "PERSONAL";
        const orgSetupComplete = 'orgSetupComplete' in data ? data.orgSetupComplete : false;

        if (autoAuthenticated) {
          // Session was created - redirect directly to appropriate route
          toast.success("Email verified!", {
            description: "Welcome! Taking you to your dashboard...",
          });

          if (accountType === "ORG" && !orgSetupComplete) {
            router.push("/onboarding/organization");
          } else {
            router.push("/");
          }
        } else {
          // Fallback: redirect to sign-in
          toast.success("Email verified!", {
            description: "Please log in to continue.",
          });
          router.push("/sign-in");
        }
      } else if ('error' in data && data.error) {
        toast.error(String(data.error));
      }
    },
    onError: () => {
      toast.error("Failed to verify email.");
    },
  });

  return mutation;
};