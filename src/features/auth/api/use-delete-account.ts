import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.auth.account.$delete, 200>;

export const useDeleteAccount = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.auth.account.$delete();

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current"] });
      router.push("/sign-in");
    },
  });

  return mutation;
};
