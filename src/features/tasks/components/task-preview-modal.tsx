"use client";

import { InferRequestType } from "hono";
import { client } from "@/lib/rpc";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ExternalLink,
  Link,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import IconHelp from "@/components/icon-help";
import { Attachment } from "@/features/attachments/types";
import { TaskAttachments } from "@/features/attachments/components/task-attachments";
import { useLocalDraft } from "@/hooks/use-local-draft";


import { useGetTask } from "../api/use-get-task";
import { useTaskPreviewModal } from "../hooks/use-task-preview-modal";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { PopulatedTask } from "../types";

import { useUpdateTask } from "../api/use-update-task";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useCurrent } from "@/features/auth/api/use-current";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { CommentList } from "@/features/comments/components/comment-list";
import { CommentInput } from "@/features/comments/components/comment-input";

import { StatusSelector } from "@/features/custom-columns/components/status-selector";
import { PrioritySelector } from "./priority-selector";
import { TypeSelector } from "./type-selector";
import { AssigneeMultiSelect } from "./assignee-multi-select";
import { DatePicker } from "@/components/date-picker";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkItemIcon } from "@/features/timeline/components/work-item-icon";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor, setMentionMembers } from "@/components/editor";

// Default work item type labels
const typeLabels: Record<string, string> = {
  TASK: "Task",
  BUG: "Bug",
  EPIC: "Epic",
  STORY: "Story",
  SUBTASK: "Subtask",
};

type UpdateTaskPayload = InferRequestType<typeof client.api.tasks[":taskId"]["$patch"]>["json"];

interface TaskPreviewContentProps {
  task: PopulatedTask;
  workspaceId: string;
  onEdit: () => void;
  onClose: () => void;
  onAttachmentPreview?: (attachment: Attachment) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const TaskPreviewContent = ({ task, workspaceId, onEdit, onClose, onAttachmentPreview, canEdit = false, canDelete = false }: TaskPreviewContentProps) => {
  const { mutate: updateTask } = useUpdateTask();
  const { data: members } = useGetMembers({ workspaceId });
  const { data: project } = useGetProject({ projectId: task.projectId });
  const { data: user } = useCurrent();

  const [title, setTitle] = useState(task.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Use localStorage-based draft for description
  const {
    content: description,
    setContent: setDescription,
    isSyncing: isSavingDescription,
    syncNow: syncDescriptionNow,
  } = useLocalDraft({
    taskId: task.$id,
    initialContent: task.description || "",
    onSync: async (content) => {
      updateTask({
        param: { taskId: task.$id },
        json: { description: content },
      });
    },
  });

  // Handle close with sync - await the sync to ensure data is saved
  const handleCloseWithSync = async () => {
    await syncDescriptionNow();
    onClose();
  };

  // Sync title when task changes
  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  // Update mention members when they load
  useEffect(() => {
    if (members?.documents) {
      setMentionMembers(
        members.documents.map((member) => ({
          id: member.$id,
          name: member.name || "",
          email: member.email,
          imageUrl: member.profileImageUrl,
        }))
      );
    }
  }, [members]);

  const memberOptions = members?.documents.map((member) => ({
    id: member.$id,
    name: member.name,
    imageUrl: member.profileImageUrl,
  })) || [];

  const handleUpdate = (updates: UpdateTaskPayload) => {
    updateTask({
      param: { taskId: task.$id },
      json: updates,
    });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== task.title) {
      handleUpdate({ name: title });
    }
  };

  // Sync description on blur
  const handleDescriptionBlur = () => {
    syncDescriptionNow();
  };

  const handleCopyUrl = async () => {
    try {
      const url = typeof window !== "undefined"
        ? `${window.location.origin}/workspaces/${workspaceId}/tasks/${task.$id}`
        : `/workspaces/${workspaceId}/tasks/${task.$id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Task URL copied to clipboard.");
    } catch {
      toast.error("Failed to copy task URL.");
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(task.$id);
      toast.success("Task ID copied to clipboard.");
    } catch {
      toast.error("Failed to copy task ID.");
    }
  };

  // Get type label from custom types or defaults
  const getTypeLabel = (typeKey: string) => {
    const customType = project?.customWorkItemTypes?.find((t: { key: string }) => t.key === typeKey);
    if (customType) return customType.label;
    return typeLabels[typeKey] || typeKey;
  };

  // Get recent comments (last 3) -> now handled by CommentList


  return (
    <div className="flex w-full  flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Work Item Type Badge */}
          {task.type && (
            <Badge variant="outline" className="px-2 py-1 text-xs font-medium gap-1.5 flex items-center">
              <WorkItemIcon
                type={task.type}
                className="size-3.5"
                project={project}
              />
              <span>{getTypeLabel(task.type)}</span>
            </Badge>
          )}
          <StatusSelector
            value={task.status}
            onChange={canEdit ? (value) => handleUpdate({ status: value }) : undefined}
            projectId={task.projectId}
            placeholder="Status"
            disabled={!canEdit}
          />
          <span className="text-xs text-muted-foreground font-mono">{task.key}</span>
        </div>

        <div className="flex items-center gap-1">
          <IconHelp content="Copy task URL" side="bottom">
            <button
              className="hover:bg-accent p-1.5 rounded-md transition-colors"
              onClick={handleCopyUrl}
            >
              <Link size={16} strokeWidth={1.5} className="text-muted-foreground" />
            </button>
          </IconHelp>

          <IconHelp content="Copy task ID" side="bottom">
            <button
              className="hover:bg-accent p-1.5 rounded-md transition-colors"
              onClick={handleCopyId}
            >
              <Copy size={16} strokeWidth={1.5} className="text-muted-foreground" />
            </button>
          </IconHelp>

          <IconHelp content="Edit task" side="bottom">
            <button
              className="hover:bg-accent p-1.5 rounded-md transition-colors"
              onClick={onEdit}
            >
              <ExternalLink size={16} strokeWidth={1.5} className="text-muted-foreground" />
            </button>
          </IconHelp>

          <button
            className="hover:bg-accent p-1.5 rounded-md transition-colors ml-1"
            onClick={handleCloseWithSync}
          >
            <X size={18} strokeWidth={1.5} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Task Title */}
            <div className="mb-4">
              {isEditingTitle && canEdit ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleBlur();
                  }}
                  autoFocus
                  className="text-xl font-semibold h-auto py-2 px-2"
                />
              ) : (
                <h1
                  className={`text-xl font-semibold text-foreground border border-transparent rounded p-2 -ml-2 transition-colors ${canEdit ? 'hover:border-border cursor-text' : ''}`}
                  onClick={() => canEdit && setIsEditingTitle(true)}
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </h3>
                {isSavingDescription && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
              </div>
              <div className="min-h-[100px]">
                <RichTextEditor
                  content={description}
                  onChange={canEdit ? setDescription : () => {}}
                  onBlur={canEdit ? handleDescriptionBlur : undefined}
                  placeholder={canEdit ? "Add a description... Use @ to mention team members, / for commands" : "No description"}
                  editable={canEdit}
                  workspaceId={workspaceId}
                  projectId={task.projectId}
                  minHeight="100px"
                  showToolbar={canEdit}
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Activity & Comments
              </h3>

              <div className="mb-4">
                <CommentInput
                  taskId={task.$id}
                  workspaceId={workspaceId}
                  placeholder="Write a comment..."
                />
              </div>

              <CommentList
                taskId={task.$id}
                workspaceId={workspaceId}
                currentUserId={user?.$id || ""}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-[320px] border-l border-border bg-background overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Properties
            </h3>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                <StatusSelector
                  value={task.status}
                  onChange={canEdit ? (value) => handleUpdate({ status: value }) : undefined}
                  projectId={task.projectId}
                  disabled={!canEdit}
                />
              </div>

              {/* Work Item Type */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
                <TypeSelector
                  value={task.type || "TASK"}
                  onValueChange={canEdit ? (value) => handleUpdate({ type: value }) : undefined}
                  project={project}
                  customTypes={project?.customWorkItemTypes}
                  className="w-full bg-card border-border"
                  disabled={!canEdit}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                <PrioritySelector
                  value={task.priority}
                  onValueChange={canEdit ? (value) => handleUpdate({ priority: value }) : undefined}
                  customPriorities={project?.customPriorities}
                  disabled={!canEdit}
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Assignees</label>
                <AssigneeMultiSelect
                  memberOptions={memberOptions}
                  selectedAssigneeIds={task.assigneeIds || []}
                  onAssigneesChange={canEdit ? (ids) => handleUpdate({ assigneeIds: ids }) : undefined}
                  placeholder="Select assignees"
                  disabled={!canEdit}
                />
              </div>

              {/* Dates */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Start Date</label>
                <DatePicker
                  value={task.dueDate ? new Date(task.dueDate) : undefined}
                  onChange={canEdit ? (date) => handleUpdate({ dueDate: date }) : undefined}
                  placeholder="Set start date"
                  className="w-full bg-card border-border"
                  disabled={!canEdit}
                />
              </div>

              {/* Due Date (Using endDate field if that's what we want, or do we have separate due date?)
                  Schema has dueDate and endDate.
                  Original view showed 'Due' mapping to task.dueDate?
                  Wait, 'Start' mapped to task.startDate, 'Due' to task.dueDate in original view.
                  Schema: dueDate: z.coerce.date().optional(), endDate: z.coerce.date().optional()
                  Wait, CreateTask uses 'dueDate' as Start Date label?
                  Step 538: <FormLabel>Start Date</FormLabel> <DatePicker {...field} name="dueDate" />
                  So dueDate = Start Date.
                  And endDate = End Date.
              */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">End Date</label>
                <DatePicker
                  value={task.endDate ? new Date(task.endDate) : undefined}
                  onChange={canEdit ? (date) => handleUpdate({ endDate: date }) : undefined}
                  placeholder="Set end date"
                  className="w-full bg-card border-border"
                  disabled={!canEdit}
                />
              </div>

              {/* Labels */}
              {/* If we want to support labels, we need LabelSelector. Skipping for now to keep it simpler unless requested, as it requires complex project label fetching */}

              {/* Time Estimate */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Time Estimate (hours)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="None"
                  defaultValue={task.estimatedHours}
                  onBlur={canEdit ? (e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : null;
                    if (val !== task.estimatedHours) {
                      handleUpdate({ estimatedHours: val || undefined });
                    }
                  } : undefined}
                  className="h-9 bg-card border-border"
                  disabled={!canEdit}
                />
              </div>

              {/* Story Points */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Story Points</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="None"
                  defaultValue={task.storyPoints}
                  onBlur={canEdit ? (e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    if (val !== task.storyPoints) {
                      handleUpdate({ storyPoints: val || undefined });
                    }
                  } : undefined}
                  className="h-9 bg-card border-border"
                  disabled={!canEdit}
                />
              </div>

              {/* Flagged */}
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  checked={task.flagged}
                  onCheckedChange={canEdit ? (checked) => handleUpdate({ flagged: checked as boolean }) : undefined}
                  id="flagged"
                  disabled={!canEdit}
                />
                <label htmlFor="flagged" className="text-sm font-medium text-muted-foreground cursor-pointer">Flagged</label>
              </div>
            </div>
          </div>
          {/* Attachments */}
          <div className="pt-2 border-t px-4">
            <TaskAttachments taskId={task.$id} workspaceId={workspaceId} onPreview={onAttachmentPreview} />
          </div>

          {/* Edit Button */}
          <div className="px-4 py-4 bg-muted/50 border-t border-border sticky bottom-0">
            <Button
              onClick={onEdit}
              className="w-full"
              size="sm"
            >
              <ExternalLink size={14} className="mr-2" />
              Open Full View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaskPreviewModalWrapper = () => {
  const router = useRouter();
  const { taskId, close } = useTaskPreviewModal();
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useGetTask({ taskId: taskId || "" });
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const isOpen = !!taskId;

  // Get workspace admin status
  const { isAdmin } = useCurrentMember({ workspaceId });
  
  // Get project-level task permissions
  const { 
    canEditTasksProject, 
    canDeleteTasksProject,
  } = useProjectPermissions({ 
    projectId: data?.projectId || null, 
    workspaceId 
  });
  
  // Effective permissions: Admin OR has project-level permission
  const canEditTasks = isAdmin || canEditTasksProject;
  const canDeleteTasks = isAdmin || canDeleteTasksProject;



  const handleEdit = () => {
    if (!workspaceId || !data?.$id) return;   // <-- Ensures ID exists

    const target = `/workspaces/${workspaceId}/tasks/${data.$id}`;


    try {
      router.push(target);
    } catch {
      // Navigation error handled silently
    }
  };


  const handleClose = useCallback(() => {
    close();
  }, [close]);

  const handleAttachmentPreview = (attachment: Attachment) => {
    setPreviewAttachment(attachment);
  };

  const closeAttachmentPreview = () => setPreviewAttachment(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60  z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex  items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="flex flex-col h-[500px]">
              {/* Header skeleton */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
              {/* Content skeleton */}
              <div className="flex flex-1">
                <div className="flex-1 p-5">
                  <Skeleton className="h-7 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div className="w-[260px] border-l bg-background p-4">
                  <Skeleton className="h-4 w-20 mb-4" />
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">Task not found</p>
            </div>
          ) : (
            <>
              <TaskPreviewContent
                task={data}
                workspaceId={workspaceId}
                onEdit={handleEdit}
                onClose={handleClose}
                onAttachmentPreview={handleAttachmentPreview}
                canEdit={canEditTasks}
                canDelete={canDeleteTasks}
              />

              {/* Attachment preview overlay */}
              {previewAttachment && (
                <div className="fixed inset-0 z-60 flex flex-col bg-background">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{previewAttachment.name}</span>
                      <span className="text-xs text-muted-foreground">{previewAttachment.mimeType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded hover:bg-accent" onClick={closeAttachmentPreview}>
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                    {previewAttachment.mimeType.startsWith("image/") ? (
                      // Image preview
                      // Use the preview endpoint
                      // eslint-disable-next-line @next/next/no-img-element -- Dynamic preview URL not compatible with Next.js Image
                      <img
                        src={`/api/attachments/${previewAttachment.$id}/preview?workspaceId=${workspaceId}`}
                        alt={previewAttachment.name}
                        className="max-h-[80vh] max-w-full object-contain"
                      />
                    ) : (
                      // Fallback to iframe for PDFs and other previewable types
                      <iframe
                        src={`/api/attachments/${previewAttachment.$id}/preview?workspaceId=${workspaceId}`}
                        title={previewAttachment.name}
                        className="w-full h-[80vh] border-0"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
