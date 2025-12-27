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
      redirect(`/workspaces/${workspaces.documents[0].$id}`);
    }
  }

  redirect("/sign-in");
}

