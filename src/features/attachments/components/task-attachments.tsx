"use client";

import { useState, useRef } from "react";
import {
  Paperclip,
  Plus,
  ChevronDown,
  ChevronRight,
  File,
  Image,
  FileText,
  Archive,
  Download,
  Trash2,
  Eye,
  Upload,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";

import { useGetAttachments } from "../hooks/use-get-attachments";
import { useUploadAttachment } from "../hooks/use-upload-attachment";
import { useDeleteAttachment } from "../hooks/use-delete-attachment";
import { Attachment } from "../types";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, PREVIEWABLE_TYPES } from "../schemas";

interface TaskAttachmentsProps {
  taskId: string;
  workspaceId: string;
  onPreview?: (attachment: Attachment) => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) {
    return <Image  alt-text="Image file icon" className="size-4 text-purple-500" />;
  }
  if (mimeType.includes("pdf")) {
    return <FileText className="size-4 text-red-500" />;
  }
  if (mimeType.includes("document") || mimeType.includes("text")) {
    return <FileText className="size-4 text-blue-500" />;
  }
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive")) {
    return <Archive className="size-4 text-amber-500" />;
  }
  return <File className="size-4 text-gray-400" />;
};

const formatFileSize = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 10) / 10 + " " + sizes[i];
};

const getFileExtension = (name: string) => {
  const ext = name.split(".").pop()?.toUpperCase();
  return ext || "FILE";
};

interface AttachmentItemProps {
  attachment: Attachment;
  workspaceId: string;
}

const AttachmentItem = ({ attachment, workspaceId, onPreview }: AttachmentItemProps & { onPreview?: (attachment: Attachment) => void }) => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Attachment",
    "Are you sure you want to delete this attachment?",
    "destructive"
  );

  const { mutate: deleteAttachment, isPending } = useDeleteAttachment();

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    deleteAttachment({
      param: { attachmentId: attachment.$id },
      query: { workspaceId },
    });
  };

  const handleDownload = () => {
    const downloadUrl = `/api/attachments/${attachment.$id}/download?workspaceId=${workspaceId}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(attachment);
      return;
    }
    const previewUrl = `/api/attachments/${attachment.$id}/preview?workspaceId=${workspaceId}`;
    window.open(previewUrl, "_blank");
  };

  const isPreviewable = PREVIEWABLE_TYPES.includes(attachment.mimeType);

  return (
    <>
      <ConfirmDialog />
      <div className="group flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-md transition-colors">
        <div className="flex-shrink-0">
          {getFileIcon(attachment.mimeType)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-normal text-gray-700 truncate leading-tight">
            {attachment.name}
          </p>
          <p className="text-[11px] text-gray-400 leading-tight">
            {formatFileSize(attachment.size)} · {getFileExtension(attachment.name)}
          </p>
        </div>
        <div className="flex items-center opactiy-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                disabled={isPending}
              >
                <MoreHorizontal className="size-3.5 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {isPreviewable && (
                <DropdownMenuItem onClick={handlePreview} className="text-xs">
                  <Eye className="size-3.5 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDownload} className="text-xs">
                <Download className="size-3.5 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-xs text-red-600 focus:text-red-600"
                disabled={isPending}
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

export const TaskAttachments = ({ taskId, workspaceId, onPreview }: TaskAttachmentsProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments, isLoading } = useGetAttachments({
    taskId,
    workspaceId,
  });

  const { mutate: uploadAttachment, isPending: isUploading } = useUploadAttachment();

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);
      formData.append("workspaceId", workspaceId);

      uploadAttachment({ form: formData });
    });
    setUploadOpen(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const attachmentCount = attachments?.length || 0;

  return (
    <div className="flex flex-col px-2 py-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          <span>Attachments</span>
          {attachmentCount > 0 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {attachmentCount}
            </span>
          )}
        </button>

        <Popover open={uploadOpen} onOpenChange={setUploadOpen}>
          <PopoverTrigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Plus className="size-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-0 bg-white border border-gray-200 shadow-lg"
            align="end"
            side="left"
            sideOffset={8}
          >
            <div
              className={cn(
                "p-4 transition-colors cursor-pointer",
                dragActive && "bg-blue-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2 py-4">
                <div
                  className={cn(
                    "p-3 rounded-full transition-colors",
                    dragActive ? "bg-blue-100" : "bg-gray-100"
                  )}
                >
                  <Upload
                    className={cn(
                      "size-5",
                      dragActive ? "text-blue-500" : "text-gray-400"
                    )}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-700">
                    {dragActive ? "Drop to upload" : "Drop files or click"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Max 50MB · Images, docs, archives
                  </p>
                </div>
                {isUploading && (
                  <div className="w-full max-w-[180px] space-y-1.5">
                    <Progress value={50} className="h-1.5" />
                    <p className="text-[10px] text-gray-500 text-center">Uploading...</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept={ALLOWED_FILE_TYPES.join(",")}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Attachments List */}
      {isExpanded && (
        <div className="space-y-0.5">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-2">
              <Loader2 className="size-4 animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">Loading...</span>
            </div>
          ) : attachmentCount === 0 ? (
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded-md w-full text-left transition-colors"
            >
              <Paperclip className="size-4 text-gray-400" />
              <span className="text-[13px] font-normal text-gray-500">
                Add attachment
              </span>
            </button>
          ) : (
            attachments?.map((attachment) => (
              <AttachmentItem
                key={attachment.$id}
                attachment={attachment}
                workspaceId={workspaceId}
                onPreview={onPreview}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};