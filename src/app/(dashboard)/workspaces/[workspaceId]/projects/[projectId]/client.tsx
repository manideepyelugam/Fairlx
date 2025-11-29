"use client";

import { Layers, Github } from "lucide-react";
import Link from "next/link";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { ProjectSettingsModal } from "@/features/projects/components/project-settings-modal";

export const ProjectIdClient = () => {
  const projectId = useProjectId();
  const { data: project, isLoading: isLoadingProject } = useGetProject({
    projectId,
  });
  const { isAdmin, isLoading: isLoadingMember } = useCurrentMember({
    workspaceId: project?.workspaceId || "",
  });

  const isLoading = isLoadingProject || isLoadingMember;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!project) {
    return <PageError message="Project not found." />;
  }

  return (
    <div className="flex flex-col gap-y-4">
      
      <div className="flex items-center mb-4 justify-between">

        <div className="flex gap-x-2 flex-col items-start gap-y-1.5">
          <p className="text-2xl tracking-tight font-semibold">{project.name}</p>
          <p className="text-sm tracking-normal font-medium text-neutral-500">Track your project and goals with full AI Assistance</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}/sprints`} className="!text-sm">
            <button 
              type="button" 
              className="inline-flex items-center rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Layers className="size-4 mr-3" />
              Sprint Board
            </button>
          </Link>

          <Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}/github`} className="!text-sm">
            <button 
              type="button" 
              className="inline-flex items-center rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Github className="size-4 mr-3" />
              AI Github
            </button>
          </Link>

          <ProjectSettingsModal project={project} isAdmin={isAdmin} />
        </div>

      </div>

      <TaskViewSwitcher hideProjectFilter={true} />
    </div>
  );
};
