import { redirect } from "next/navigation";

interface WorkflowsPageProps {
  params: Promise<{ workspaceId: string; spaceId: string }>;
}

const WorkflowsPage = async ({ params }: WorkflowsPageProps) => {
  const { workspaceId, spaceId } = await params;

  // Redirect to space page - workflows are now managed via modal
  redirect(`/workspaces/${workspaceId}/spaces/${spaceId}`);
};

export default WorkflowsPage;
