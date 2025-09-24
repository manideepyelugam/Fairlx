import { Models } from "node-appwrite";

export type Attachment = Models.Document & {
  name: string;
  size: number;
  mimeType: string;
  fileId: string;
  taskId: string;
  workspaceId: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
};

export type PopulatedAttachment = Attachment & {
  uploader?: { $id: string; name: string };
  task?: { $id: string; name: string };
};

export type AttachmentUploadData = {
  name: string;
  size: number;
  mimeType: string;
  file: File;
  taskId: string;
  workspaceId: string;
};

export type AttachmentPreview = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string;
  isPreviewable: boolean;
};