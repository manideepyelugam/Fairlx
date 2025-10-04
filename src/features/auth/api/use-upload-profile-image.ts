import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { data: { url: string } },
    Error,
    { file: File }
  >({
    mutationFn: async ({ file }) => {
      const response = await client.api.auth["profile-image"].$post({
        form: { file },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((errorData as { error?: string }).error || "Failed to upload profile image");
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
  });

  return mutation;
};
