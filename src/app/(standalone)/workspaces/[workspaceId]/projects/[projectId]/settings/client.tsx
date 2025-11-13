"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { ProjectTeamAssignment } from "@/features/projects/components/project-team-assignment";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";

export const ProjectIdSettingsClient = () => {
  const projectId = useProjectId();
  const { data: initialValues, isLoading } = useGetProject({ projectId });
  const {
    isLoading: isMemberLoading,
    isAdmin,
  } = useCurrentMember({ workspaceId: initialValues?.workspaceId || "" });

  if (isLoading || isMemberLoading) {
    return <PageLoader />;
  }

  if (!initialValues) {
    return <PageError message="Project not found." />;
  }

  return (
    <div className="w-full lg:max-w-xl">
      <EditProjectForm initialValues={initialValues} />
      {isAdmin && (
        <ProjectTeamAssignment
          project={initialValues}
          workspaceId={initialValues.workspaceId}
        />
      )}
    </div>
  );
};
