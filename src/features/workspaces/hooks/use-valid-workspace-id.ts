import { useParams } from "next/navigation";

/**
 * Safe workspace ID hook with validation and loading state
 * 
 * Use this when you need to guard against undefined workspaceId
 * before making API calls or rendering workspace-specific content.
 * 
 * @example
 * const { workspaceId, isValid, isLoading } = useValidWorkspaceId();
 * if (!isValid) return <ErrorState />;
 */
export const useValidWorkspaceId = () => {
    const params = useParams();
    const workspaceId = params?.workspaceId as string | undefined;

    // Check if workspaceId is a valid, non-empty string
    const isValid = Boolean(
        workspaceId &&
        workspaceId !== 'undefined' &&
        workspaceId !== 'null' &&
        workspaceId.trim().length > 0
    );

    return {
        // Return null if invalid to make TypeScript checks easier
        workspaceId: isValid ? workspaceId : null,
        isValid,
        // Params may be null during initial render in some Next.js scenarios
        isLoading: params === null,
    };
};
