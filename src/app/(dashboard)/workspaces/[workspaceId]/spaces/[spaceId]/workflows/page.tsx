import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { WorkflowsClient } from "./client";

const WorkflowsPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");
  return <WorkflowsClient />;
};

export default WorkflowsPage;
