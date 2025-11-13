import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { TeamIdClient } from "./client";

interface TeamIdPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

const TeamIdPage = async ({ params }: TeamIdPageProps) => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const { teamId } = await params;

  return <TeamIdClient teamId={teamId} />;
};

export default TeamIdPage;
