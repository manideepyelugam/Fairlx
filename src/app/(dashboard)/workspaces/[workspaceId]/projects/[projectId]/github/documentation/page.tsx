import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { GitHubDocumentationClient } from "./client";

const GitHubDocumentationPage = async () => {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  return <GitHubDocumentationClient />;
};

export default GitHubDocumentationPage;
