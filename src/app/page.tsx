import { getCurrent } from "@/features/auth/queries";
import { getWorkspaces } from "@/features/workspaces/queries";
import { redirect } from "next/navigation";


export default async function Home() {
  const user = await getCurrent();

  if (user) {
    const workspaces = await getWorkspaces();

    if (workspaces.total === 0) {
      // Zero-workspace state handling
      const prefs = user.prefs || {};
      if (prefs.accountType === "ORG") {
        // ORG accounts: Can access dashboard without workspaces
        redirect("/welcome");
      } else {
        // PERSONAL accounts: Mandatory workspace creation
        redirect("/onboarding/workspace");
      }
    } else {
      // Get stored default workspace preference
      const prefs = user.prefs || {};
      const defaultWorkspaceId = prefs.defaultWorkspaceId as string | undefined;
      
      // Check if stored default workspace exists in the list
      const validDefaultWorkspace = defaultWorkspaceId && 
        workspaces.documents.some(w => w.$id === defaultWorkspaceId);
      
      // Use stored default if valid, otherwise use first workspace
      const targetWorkspaceId = validDefaultWorkspace 
        ? defaultWorkspaceId 
        : workspaces.documents[0].$id;
      
      redirect(`/workspaces/${targetWorkspaceId}`);
    }
  }

  redirect("/sign-in");
}

