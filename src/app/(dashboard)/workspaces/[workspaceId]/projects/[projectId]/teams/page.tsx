import { redirect } from "next/navigation";

/**
 * Teams page redirects to Members page.
 * Teams functionality has been consolidated into the Members page.
 */
export default async function ProjectTeamsPage({
    params,
}: {
    params: Promise<{ workspaceId: string; projectId: string }>;
}) {
    const { workspaceId, projectId } = await params;
    redirect(`/workspaces/${workspaceId}/projects/${projectId}/members`);
}
