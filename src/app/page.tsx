import { getCurrent } from "@/features/auth/queries";
import { getWorkspaces } from "@/features/workspaces/queries";
import { redirect } from "next/navigation";


export default async function Home() {
  const user = await getCurrent();

  if (user) {
    const workspaces = await getWorkspaces();

    if (workspaces.total === 0) {
      // Zero-workspace state: show welcome page instead of forcing workspace creation
      redirect("/welcome");
    } else {
      redirect(`/workspaces/${workspaces.documents[0].$id}`);
    }
  }

  redirect("/sign-in");
}

