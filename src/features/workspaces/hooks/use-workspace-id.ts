import { useParams } from "next/navigation";

/**
 * Returns the workspaceId from URL params with validation.
 * Returns empty string if workspaceId is undefined/invalid to prevent
 * API calls with "undefined" as the workspaceId.
 * 
 * For components that need to guard rendering, use useValidWorkspaceId instead.
 */
export const useWorkspaceId = () => {
  const params = useParams();
  const workspaceId = params?.workspaceId as string | undefined;

  // Return empty string if undefined to prevent API calls with "undefined"
  if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
    return '';
  }

  return workspaceId;
};
