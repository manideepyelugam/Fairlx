import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import EnhancedBacklogScreen from "@/features/sprints/components/enhanced-backlog-screen";

export default async function BacklogDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const { workspaceId } = await params;
  const { projectId } = await searchParams;

  if (!projectId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold">Provide a projectId to view the Backlog</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Append <code>?projectId=YOUR_PROJECT_ID</code> to the URL.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Example: <code>/workspaces/{workspaceId}/backlog-demo?projectId=proj_123</code>
          </p>
        </div>
      </div>
    );
  }

  return <EnhancedBacklogScreen workspaceId={workspaceId} projectId={projectId} />;
}