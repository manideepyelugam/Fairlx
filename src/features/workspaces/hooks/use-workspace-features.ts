import { useGetWorkspace } from "../api/use-get-workspace";
import { WorkspaceUIMode } from "../types";

interface UseWorkspaceFeaturesProps {
  workspaceId: string;
}

export const useWorkspaceFeatures = ({ workspaceId }: UseWorkspaceFeaturesProps) => {
  const { data: workspace, isLoading } = useGetWorkspace({ workspaceId });

  const uiMode = workspace?.uiMode ?? WorkspaceUIMode.ADVANCED;
  const isSimpleMode = uiMode === WorkspaceUIMode.SIMPLE;
  const isAdvancedMode = uiMode === WorkspaceUIMode.ADVANCED;

  const enabledFeatures = workspace?.enabledFeatures ?? {
    spaces: true,
    programs: true,
    teams: true,
    customFields: true,
    workflows: true,
    timeTracking: true,
  };

  // In simple mode, all advanced features are disabled
  const features = isSimpleMode
    ? {
        spaces: false,
        programs: false,
        teams: false,
        customFields: false,
        workflows: false,
        timeTracking: true, // Keep time tracking even in simple mode
      }
    : enabledFeatures;

  return {
    uiMode,
    isSimpleMode,
    isAdvancedMode,
    features,
    isLoading,
  };
};
