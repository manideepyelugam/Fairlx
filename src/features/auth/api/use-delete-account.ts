import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { client } from "@/lib/rpc";

/**
 * Hook to delete user account
 * 
 * CRITICAL: This permanently deletes the user account and all data.
 * Cannot be undone.
 */
export const useDeleteAccount = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<{ success: boolean }, Error>({
    mutationFn: async () => {
      const response = await client.api.auth.account.$delete();

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to delete account");
      }

      return response.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data
      router.push("/sign-in");
    },
  });

  return mutation;
};
