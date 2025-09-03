import { FolderIcon, ListChecksIcon, UserIcon } from "lucide-react";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";

import { DatePicker } from "@/components/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTaskFilters } from "../hooks/use-task-filters";
import { useGetCustomColumns } from "@/features/custom-columns/api/use-get-custom-columns";
import { CustomColumn } from "@/features/custom-columns/types";
import { allIcons, statusIconMap } from "@/features/custom-columns/components/status-selector";
import { TaskStatus } from "../types";

interface DataFiltersProps {
  hideProjectFilter?: boolean;
}

export const DataFilters = ({ hideProjectFilter }: DataFiltersProps) => {
  const workspaceId = useWorkspaceId();
  const currentProjectId = useProjectId();

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const isLoading = isLoadingProjects || isLoadingMembers;

  const projectOptions = projects?.documents.map((project) => ({
    value: project.$id,
    label: project.name,
  }));

  const memberOptions = members?.documents.map((member) => ({
    value: member.$id,
    label: member.name,
  }));

  const [{ status, assigneeId, projectId, dueDate }, setFilters] =
    useTaskFilters();

  const { data: customColumnsData } = useGetCustomColumns({ 
    workspaceId, 
    projectId: currentProjectId 
  });

  const customColumnOptions: { value: string; label: string }[] | undefined =
    customColumnsData?.documents?.map((col) => {
      const c = col as unknown as CustomColumn;
      return { value: c.$id, label: c.name };
    });

  const onStatusChange = (value: string) => {
    if (value === "all") {
      setFilters({ status: null });
    } else {
      setFilters({ status: value as TaskStatus });
    }
  };

  const onAssigneeChange = (value: string) => {
    if (value === "all") {
      setFilters({ assigneeId: null });
    } else {
      setFilters({ assigneeId: value as string });
    }
  };

  const onProjectChange = (value: string) => {
    if (value === "all") {
      setFilters({ projectId: null });
    } else {
      setFilters({ projectId: value as string });
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <Select
        defaultValue={status ?? undefined}
        onValueChange={(value) => {
          onStatusChange(value);
        }}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <ListChecksIcon className="size-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.BACKLOG}>
            <div className="flex items-center gap-x-2">{statusIconMap[TaskStatus.BACKLOG]}Backlog</div>
          </SelectItem>
          <SelectItem value={TaskStatus.IN_PROGRESS}>
            <div className="flex items-center gap-x-2">{statusIconMap[TaskStatus.IN_PROGRESS]}In Progress</div>
          </SelectItem>
          <SelectItem value={TaskStatus.IN_REVIEW}>
            <div className="flex items-center gap-x-2">{statusIconMap[TaskStatus.IN_REVIEW]}In Review</div>
          </SelectItem>
          <SelectItem value={TaskStatus.TODO}>
            <div className="flex items-center gap-x-2">{statusIconMap[TaskStatus.TODO]}Todo</div>
          </SelectItem>
          <SelectItem value={TaskStatus.DONE}>
            <div className="flex items-center gap-x-2">{statusIconMap[TaskStatus.DONE]}Done</div>
          </SelectItem>

          {customColumnOptions && customColumnOptions.length > 0 && (
            <>
              <SelectSeparator />
              {customColumnOptions.map((col) => {
                const raw = customColumnsData?.documents?.find((d) => d.$id === col.value);
                const c = raw as unknown as CustomColumn | undefined;
                const IconComp = c ? (allIcons[c.icon as keyof typeof allIcons] as any) : null;
                const icon = IconComp ? (
                  <IconComp className="size-[18px]" style={{ color: c?.color }} />
                ) : (
                  <span className="w-4 h-4 rounded-full" style={{ background: c?.color }} />
                );

                return (
                  <SelectItem key={col.value} value={col.value}>
                    <div className="flex items-center gap-x-2">{icon}{col.label}</div>
                  </SelectItem>
                );
              })}
            </>
          )}
        </SelectContent>
      </Select>
      <Select
        defaultValue={assigneeId ?? undefined}
        onValueChange={(value) => {
          onAssigneeChange(value);
        }}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <UserIcon className="size-4 mr-2" />
            <SelectValue placeholder="All assignees" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          <SelectSeparator />
          {memberOptions?.map((member) => (
            <SelectItem key={member.value} value={member.value}>
              {member.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!hideProjectFilter && (
        <Select
          defaultValue={projectId ?? undefined}
          onValueChange={(value) => {
            onProjectChange(value);
          }}
        >
          <SelectTrigger className="w-full lg:w-auto h-8">
            <div className="flex items-center pr-2">
              <FolderIcon className="size-4 mr-2" />
              <SelectValue placeholder="All projects" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            <SelectSeparator />
            {projectOptions?.map((project) => (
              <SelectItem key={project.value} value={project.value}>
                {project.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <DatePicker
        placeholder="Due date"
        className="h-8 w-full lg:w-auto"
        value={dueDate ? new Date(dueDate) : undefined}
        onChange={(date) => {
          setFilters({ dueDate: date ? date.toISOString() : null });
        }}
      />
    </div>
  );
};
