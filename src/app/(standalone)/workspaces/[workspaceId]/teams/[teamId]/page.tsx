import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { TeamIdClient } from "./client";

const TeamIdPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <TeamIdClient />;
};

export default TeamIdPage;
