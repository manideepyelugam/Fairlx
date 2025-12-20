import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { WorkspaceIdJoinClient } from "./client";

const WorkspaceIdJoinPage = async ({
  params,
}: {
  params: Promise<{ workspaceId: string; inviteCode: string }>;
}) => {
  const user = await getCurrent();
  if (!user) {
    const { workspaceId, inviteCode } = await params;
    const returnUrl = `/workspaces/${workspaceId}/join/${inviteCode}`;
    redirect(`/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  return <WorkspaceIdJoinClient />;
};

export default WorkspaceIdJoinPage;
