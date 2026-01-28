/**
 * Route utilities for safe navigation with validated IDs
 * Prevents navigation with undefined/invalid IDs which cause API errors
 */

/**
 * Builds a workspace route with validation
 * @throws Error if workspaceId is undefined/empty
 */
export function buildWorkspaceRoute(workspaceId: string | undefined, path = '') {
    if (!workspaceId || workspaceId === 'undefined') {
        throw new Error('workspaceId is required for navigation');
    }
    return `/workspaces/${workspaceId}${path}`;
}

/**
 * Builds a space route with validation
 */
export function buildSpaceRoute(
    workspaceId: string | undefined,
    spaceId: string | undefined,
    path = ''
) {
    if (!workspaceId || workspaceId === 'undefined') {
        throw new Error('workspaceId is required for navigation');
    }
    if (!spaceId || spaceId === 'undefined') {
        throw new Error('spaceId is required for navigation');
    }
    return `/workspaces/${workspaceId}/spaces/${spaceId}${path}`;
}

/**
 * Builds a project route with validation
 */
export function buildProjectRoute(
    workspaceId: string | undefined,
    projectId: string | undefined,
    path = ''
) {
    if (!workspaceId || workspaceId === 'undefined') {
        throw new Error('workspaceId is required for navigation');
    }
    if (!projectId || projectId === 'undefined') {
        throw new Error('projectId is required for navigation');
    }
    return `/workspaces/${workspaceId}/projects/${projectId}${path}`;
}

/**
 * Validates that all route parameters are present and valid
 * @returns true if all IDs are valid strings, false otherwise
 */
export function validateRouteParams(...ids: (string | undefined | null)[]): boolean {
    return ids.every(id => {
        if (!id) return false;
        if (id === 'undefined' || id === 'null') return false;
        if (typeof id !== 'string') return false;
        return id.trim().length > 0;
    });
}

/**
 * Safe router.push wrapper that validates IDs before navigation
 * Returns false if navigation was blocked due to invalid IDs
 */
export function safeNavigate(
    router: { push: (url: string) => void },
    url: string,
    requiredIds: (string | undefined | null)[]
): boolean {
    if (!validateRouteParams(...requiredIds)) {
        return false;
    }
    router.push(url);
    return true;
}
