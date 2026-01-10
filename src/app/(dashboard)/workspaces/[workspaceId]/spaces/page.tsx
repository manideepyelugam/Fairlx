import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { SpacesClient } from "./client";

const SpacesPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");
  return <SpacesClient />;
};

export default SpacesPage;
