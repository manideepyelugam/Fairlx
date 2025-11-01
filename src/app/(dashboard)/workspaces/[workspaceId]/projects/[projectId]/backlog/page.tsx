import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { BacklogClient } from "./client";

export default async function BacklogPage() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <BacklogClient />;
}
