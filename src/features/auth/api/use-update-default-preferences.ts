import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface UpdateDefaultPreferencesRequest {
  defaultWorkspaceId?: string | null;
}

export const useUpdateDefaultPreferences = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<{ success: boolean }, Error, UpdateDefaultPreferencesRequest>({
    mutationFn: async (json) => {
      const response = await client.api.auth["update-prefs"].$post({
        json: {
          defaultWorkspaceId: json.defaultWorkspaceId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update default preferences");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current"] });
      toast.success("Default workspace updated successfully");
    },
    onError: () => {
      toast.error("Failed to update default workspace");
    },
  });

  return mutation;
};
