import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { GitHubIntegrationClient } from "@/app/(dashboard)/workspaces/[workspaceId]/projects/[projectId]/github/client";

const GitHubIntegrationPage = async () => {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  return <GitHubIntegrationClient />;
};

export default GitHubIntegrationPage;
