import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";

import { TimeTrackingClient } from "./client";

export default async function TimeTrackingPage() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <TimeTrackingClient />;
}
