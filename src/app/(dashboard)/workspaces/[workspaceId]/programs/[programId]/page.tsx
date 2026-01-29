import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { ProgramIdClient } from "./client";

const ProgramIdPage = async () => {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  return <ProgramIdClient />;
};

export default ProgramIdPage;
