import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

/**
 * Hook to delete user account
 * 
 * TODO: Implement account deletion endpoint in auth/server/route.ts
 * Currently stubbed as the endpoint doesn't exist.
 */
export const useDeleteAccount = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<{ success: boolean }, Error>({
    mutationFn: async () => {
      // TODO: Implement when account delete endpoint is added
      // const response = await client.api.auth.account.$delete();
      throw new Error("Account deletion is not yet implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current"] });
      router.push("/sign-in");
    },
  });

  return mutation;
};

