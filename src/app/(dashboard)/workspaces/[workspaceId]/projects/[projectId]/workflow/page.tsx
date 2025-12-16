import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { ProjectWorkflowClient } from "./client";

const ProjectWorkflowPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");
  return <ProjectWorkflowClient />;
};

export default ProjectWorkflowPage;
