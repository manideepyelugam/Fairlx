import { redirect } from "next/navigation";

// Redirect to project page with backlog tab - the dedicated backlog page is deprecated
// The backlog is now available as a tab in the TaskViewSwitcher
export default async function BacklogPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { workspaceId, projectId } = await params;
  const search = await searchParams;
  
  // Preserve any query params like workItemId
  const queryString = search.workItemId ? `&workItemId=${search.workItemId}` : "";
  
  redirect(`/workspaces/${workspaceId}/projects/${projectId}?task-view=backlog${queryString}`);
}
