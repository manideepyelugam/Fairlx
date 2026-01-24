import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";

interface WorkflowsPageProps {
  params: Promise<{ workspaceId: string; spaceId: string }>;
}

const WorkflowsPage = async ({ params }: WorkflowsPageProps) => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");
  
  const { workspaceId, spaceId } = await params;
  
  // Redirect to space page - workflows are now managed via modal
  redirect(`/workspaces/${workspaceId}/spaces/${spaceId}`);
};

export default WorkflowsPage;
