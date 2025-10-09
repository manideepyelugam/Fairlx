import { LoaderIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { EditTaskForm } from "./edit-task-form";

import { useGetTask } from "../api/use-get-task";

interface EditTaskFormWrapperProps {
  onCancel: () => void;
  id: string;
}

export const EditTaskFormWrapper = ({
  onCancel,
  id,
}: EditTaskFormWrapperProps) => {
  const workspaceId = useWorkspaceId();

  const { data: initialValues, isLoading: isLoadingTask } = useGetTask({
    taskId: id,
  });

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const projectOptions = projects?.documents.map((project) => ({
    id: project.$id,
    name: project.name,
    imageUrl: project.imageUrl,
  }));

  const memberOptions = members?.documents.map((member) => ({
    id: member.$id,
    name: member.name,
    imageUrl: member.profileImageUrl ?? undefined,
  }));

  const isLoading = isLoadingProjects || isLoadingMembers || isLoadingTask;

  if (isLoading) {
    return (
      <Card className="w-full h-[714px] border-none shadow-none">
        <CardContent className="flex items-center justify-center h-full">
          <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!initialValues) {
    return null;
  }
  // Ensure we always pass an `assigneeIds` array to the form.
  // The server may return populated `assignees` (member objects) or a legacy `assigneeId`.
  const enrichedInitialValues = {
    ...initialValues,
    assigneeIds:
      initialValues.assigneeIds && initialValues.assigneeIds.length > 0
        ? initialValues.assigneeIds
        : initialValues.assignees && initialValues.assignees.length > 0
        ? initialValues.assignees.map((a: { $id: string; name: string }) => a.$id)
        : initialValues.assigneeId
        ? [initialValues.assigneeId]
        : [],
  };

  return (
    <EditTaskForm
      onCancel={onCancel}
      projectOptions={projectOptions ?? []}
      memberOptions={memberOptions ?? []}
      initialValues={enrichedInitialValues}
    />
  );
};
