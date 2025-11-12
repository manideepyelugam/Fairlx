import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { TeamIdClient } from "./client";

interface TeamIdPageProps {
  params: {
    teamId: string;
  };
}

const TeamIdPage = async ({ params }: TeamIdPageProps) => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <TeamIdClient teamId={params.teamId} />;
};

export default TeamIdPage;
