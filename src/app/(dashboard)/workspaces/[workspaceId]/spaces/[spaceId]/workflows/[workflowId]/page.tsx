import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { WorkflowDetailClient } from "./client";

const WorkflowDetailPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <WorkflowDetailClient />;
};

export default WorkflowDetailPage;
