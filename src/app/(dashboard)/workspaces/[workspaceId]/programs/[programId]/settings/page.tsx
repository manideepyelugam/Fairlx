import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { ProgramSettingsClient } from "./client";

const ProgramSettingsPage = async () => {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  return <ProgramSettingsClient />;
};

export default ProgramSettingsPage;
