import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { SprintClient } from "./client";

export default async function SprintsPage() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <SprintClient />;
}
