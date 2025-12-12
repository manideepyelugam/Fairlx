"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  ExternalLink,
  Link,
  Copy,
  Calendar,
  Flag,
  Clock,
  MessageCircle,
  CircleIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleCheckIcon,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import IconHelp from "@/components/icon-help";
import { cn } from "@/lib/utils";
import { Attachment } from "@/features/attachments/types";
import { TaskAttachments } from "@/features/attachments/components/task-attachments";


import { useGetTask } from "../api/use-get-task";
import { useTaskPreviewModal } from "../hooks/use-task-preview-modal";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetComments } from "@/features/comments/hooks/use-get-comments";
import { TaskStatus, TaskPriority, PopulatedTask } from "../types";
import { MemberAvatar } from "@/features/members/components/member-avatar";


// Status configuration
const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  [TaskStatus.TODO]: {
    icon: <CircleIcon className="size-3.5" />,
    label: "Todo",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  [TaskStatus.ASSIGNED]: {
    icon: <CircleIcon className="size-3.5" />,
    label: "Backlog",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  [TaskStatus.IN_PROGRESS]: {
    icon: <CircleDotDashedIcon className="size-3.5" />,
    label: "In Progress",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  [TaskStatus.IN_REVIEW]: {
    icon: <CircleDotIcon className="size-3.5" />,
    label: "In Review",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  [TaskStatus.DONE]: {
    icon: <CircleCheckIcon className="size-3.5" />,
    label: "Done",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
};

// Priority configuration
const priorityConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  [TaskPriority.URGENT]: {
    icon: <AlertTriangle className="size-3.5" />,
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  [TaskPriority.HIGH]: {
    icon: <ArrowUp className="size-3.5" />,
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  [TaskPriority.MEDIUM]: {
    icon: <Minus className="size-3.5" />,
    label: "Medium",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  [TaskPriority.LOW]: {
    icon: <ArrowDown className="size-3.5" />,
    label: "Low",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
};

// Label colors
const labelColors: Record<string, string> = {
  Bug: "bg-red-500",
  Feature: "bg-purple-500",
  Improvement: "bg-blue-500",
  Documentation: "bg-green-500",
  Design: "bg-pink-500",
};

interface TaskPreviewContentProps {
  task: PopulatedTask;
  workspaceId: string;
  onEdit: () => void;
  onClose: () => void;
  onAttachmentPreview?: (attachment: Attachment) => void;
}

const TaskPreviewContent = ({ task, workspaceId, onEdit, onClose, onAttachmentPreview }: TaskPreviewContentProps) => {
  const { data: comments } = useGetComments({ taskId: task.$id, workspaceId });

  const currentStatus = statusConfig[task.status] || {
    icon: <CircleDotDashedIcon className="size-3.5 text-gray-400" />,
    label: "Backlog",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  };

  const currentPriority = task.priority ? priorityConfig[task.priority] : null;

  const currentAssignee = task.assignees && task.assignees.length > 0
    ? task.assignees[0]
    : task.assignee;

  const handleCopyUrl = async () => {
    try {
      const url = typeof window !== "undefined"
        ? `${window.location.origin}/workspaces/${workspaceId}/tasks/${task.$id}`
        : `/workspaces/${workspaceId}/tasks/${task.$id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Task URL copied to clipboard.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy task URL.");
    }
  };




  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(task.$id);
      toast.success("Task ID copied to clipboard.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy task ID.");
    }
  };

  // Get recent comments (last 3)
  const recentComments = comments?.slice(0, 3) || [];

  return (
    <div className="flex w-full  flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium", currentStatus.bgColor, currentStatus.color)}>
            {currentStatus.icon}
            <span>{currentStatus.label}</span>
          </div>
          {task.key && (
            <span className="text-xs text-gray-500 font-mono">{task.key}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <IconHelp content="Copy task URL" side="bottom">
            <button
              className="hover:bg-gray-100 p-1.5 rounded-md transition-colors"
              onClick={handleCopyUrl}
            >
              <Link size={16} strokeWidth={1.5} className="text-gray-500" />
            </button>
          </IconHelp>

          <IconHelp content="Copy task ID" side="bottom">
            <button
              className="hover:bg-gray-100 p-1.5 rounded-md transition-colors"
              onClick={handleCopyId}
            >
              <Copy size={16} strokeWidth={1.5} className="text-gray-500" />
            </button>
          </IconHelp>

          <IconHelp content="Edit task" side="bottom">
            <button
              className="hover:bg-gray-100 p-1.5 rounded-md transition-colors"
              onClick={onEdit}
            >
              <ExternalLink size={16} strokeWidth={1.5} className="text-gray-500" />
            </button>
          </IconHelp>

          <button
            className="hover:bg-gray-100 p-1.5 rounded-md transition-colors ml-1"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.5} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Task Title */}
            <h1 className="text-xl font-semibold text-gray-900 mb-4">{task.name}</h1>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Description
              </h3>
              {task.description ? (
                (() => {
                  const words = (task.description || "").trim().split(/\s+/).filter(Boolean);
                  const maxWords = 100;
                  const isLong = words.length > maxWords;
                  const preview = isLong ? words.slice(0, maxWords).join(" ") : task.description;

                  return (
                    <div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {preview}{isLong ? "..." : ""}
                      </p>
                      {isLong && (
                        <div className="mt-2">
                          <button
                            onClick={onEdit}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View more
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-gray-400 italic">No description provided</p>
              )}
            </div>

            {/* Activity Preview */}
            <div className="border-t pt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Activity
                </h3>
                {comments && comments.length > 3 && (
                  <button
                    onClick={onEdit}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all ({comments.length})
                  </button>
                )}
              </div>

              {recentComments.length > 0 ? (
                <div className="space-y-3">
                  {recentComments.map((comment: any) => {
                    const initials = comment.author?.name
                      ? comment.author.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
                      : "??";

                    return (
                      <div key={comment.$id} className="flex gap-3">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={comment.author?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs bg-blue-500 text-white">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-900">
                              {comment.author?.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(comment.$createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <MessageCircle size={16} />
                  <span>No comments yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-[320px] border-l bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
              Properties
            </h3>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Status</label>
                <div className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm", currentStatus.bgColor)}>
                  <span className={currentStatus.color}>{currentStatus.icon}</span>
                  <span className={cn("font-medium", currentStatus.color)}>{currentStatus.label}</span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Priority</label>
                {currentPriority ? (
                  <div className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm", currentPriority.bgColor)}>
                    <span className={currentPriority.color}>{currentPriority.icon}</span>
                    <span className={cn("font-medium", currentPriority.color)}>{currentPriority.label}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Not set</span>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Assignee</label>
                {currentAssignee ? (
                  <div className="flex items-center gap-2">
                    <MemberAvatar
                      name={currentAssignee.name || ""}
                      imageUrl={currentAssignee.profileImageUrl}
                      className="size-6"
                    />
                    <span className="text-sm text-gray-700">{currentAssignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>

              {/* Dates */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Dates</label>
                <div className="space-y-1.5">
                  {task.startDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-500">Start:</span>
                      <span className="text-gray-700">
                        {new Date(task.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-500">Due:</span>
                      <span className="text-gray-700">
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {!task.startDate && !task.dueDate && (
                    <span className="text-sm text-gray-400">No dates set</span>
                  )}
                </div>
              </div>

              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Labels</label>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            labelColors[label] || "bg-gray-400"
                          )}
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Estimate */}
              {task.estimatedHours && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Time Estimate</label>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-700">{task.estimatedHours}h</span>
                  </div>
                </div>
              )}

              {/* Story Points */}
              {task.storyPoints && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Story Points</label>
                  <span className="inline-flex items-center justify-center size-6 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {task.storyPoints}
                  </span>
                </div>
              )}

              {/* Flagged */}
              {task.flagged && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <Flag size={14} className="fill-red-500" />
                  <span className="font-medium">Flagged</span>
                </div>
              )}
            </div>
          </div>
          {/* Attachments */}
          <div className="pt-2 border-t px-4">
            <TaskAttachments taskId={task.$id} workspaceId={workspaceId} onPreview={onAttachmentPreview} />
          </div>

          {/* Edit Button */}
          <div className="px-4 py-4 border-t sticky bottom-0">
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

  
  
  const handleEdit = () => {
  if (!workspaceId || !data?.$id) return;   // <-- Ensures ID exists

  const target = `/workspaces/${workspaceId}/tasks/${data.$id}`;


  try {
  
    router.push(target);
    console.log("Navigating to:", target);
  } catch (error) {
    console.error("Failed to navigate to task edit page:", error);
  }
};


  const handleClose = () => {
    close();
  };

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
  }, [isOpen]);

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
          className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
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
                <div className="w-[260px] border-l bg-gray-50 p-4">
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
              <p className="text-gray-500">Task not found</p>
            </div>
          ) : (
            <>
              <TaskPreviewContent
                task={data}
                workspaceId={workspaceId}
                onEdit={handleEdit}
                onClose={handleClose}
                onAttachmentPreview={handleAttachmentPreview}
              />

              {/* Attachment preview overlay */}
              {previewAttachment && (
                <div className="fixed inset-0 z-60 flex flex-col bg-white">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{previewAttachment.name}</span>
                      <span className="text-xs text-gray-400">{previewAttachment.mimeType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded hover:bg-gray-100" onClick={closeAttachmentPreview}>
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                    {previewAttachment.mimeType.startsWith("image/") ? (
                      // Image preview
                      // Use the preview endpoint
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
