/**
 * BYOB Workspace Page
 * 
 * Re-exports the Cloud workspace page component.
 * sessionMiddleware handles routing all data operations to customer Appwrite,
 * so the same workspace dashboard works for both Cloud and BYOB users.
 * 
 * useWorkspaceId() reads params.workspaceId which works correctly here
 * because the param name is the same in both path structures:
 *   Cloud: /workspaces/[workspaceId]
 *   BYOB:  /[orgSlug]/workspaces/[workspaceId]
 */
export { default } from "@/app/(dashboard)/workspaces/[workspaceId]/page";
