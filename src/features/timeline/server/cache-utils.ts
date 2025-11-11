/**
 * Timeline Cache Management Utilities
 * 
 * Since we're using Hono routes instead of Next.js API routes,
 * cache revalidation happens through client-side invalidation
 * or through server actions.
 * 
 * The client-side already invalidates React Query cache.
 * For Next.js cache, we rely on the TTL (60 seconds).
 * 
 * For manual revalidation, use the server actions in ./revalidate.ts
 */

export const CACHE_KEYS = {
  timeline: (workspaceId: string, projectId?: string) =>
    `timeline-data-${workspaceId}-${projectId || "all"}`,
  assignee: (assigneeId: string) => `assignee-${assigneeId}`,
} as const;

export const CACHE_TAGS = {
  timeline: "timeline",
  workspace: (workspaceId: string) => `workspace-${workspaceId}`,
  assignee: (assigneeId: string) => `assignee-${assigneeId}`,
} as const;

/**
 * Helper to determine if cache should be bypassed
 * Useful for development or when fresh data is critical
 */
export function shouldBypassCache(): boolean {
  return process.env.NODE_ENV === "development" && 
         process.env.BYPASS_TIMELINE_CACHE === "true";
}
