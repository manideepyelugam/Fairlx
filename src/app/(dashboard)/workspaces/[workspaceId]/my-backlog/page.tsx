import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { MyBacklogClient } from "./client";

const MyBacklogPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <MyBacklogClient />;
};

export default MyBacklogPage;
