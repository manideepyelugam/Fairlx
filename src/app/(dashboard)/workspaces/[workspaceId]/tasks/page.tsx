import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { MyWorkView } from "@/features/sprints/components/my-work-view";

const TasksPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return (
    <div className="h-full flex flex-col">
      <MyWorkView />
    </div>
  );
};

export default TasksPage;
