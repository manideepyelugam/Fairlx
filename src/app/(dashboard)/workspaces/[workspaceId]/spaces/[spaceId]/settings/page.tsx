import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { SpaceSettingsClient } from "./client";

const SpaceSettingsPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");
  return <SpaceSettingsClient />;
};

export default SpaceSettingsPage;
