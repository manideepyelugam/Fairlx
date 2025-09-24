import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, ATTACHMENTS_ID, ATTACHMENTS_BUCKET_ID } from "@/config";
import { Attachment } from "../types";
import { Query, ID } from "node-appwrite";

export const getAttachments = async (taskId: string, workspaceId: string): Promise<Attachment[]> => {
  const { databases } = await createAdminClient();

  const attachments = await databases.listDocuments(
    DATABASE_ID,
    ATTACHMENTS_ID,
    [
      Query.equal("taskId", taskId),
      Query.equal("workspaceId", workspaceId),
      Query.orderDesc("$createdAt"),
    ]
  );

  return attachments.documents as Attachment[];
};

export const createAttachment = async (data: {
  name: string;
  size: number;
  mimeType: string;
  fileId: string;
  taskId: string;
  workspaceId: string;
  uploadedBy: string;
}): Promise<Attachment> => {
  const { databases } = await createAdminClient();

  const attachment = await databases.createDocument(
    DATABASE_ID,
    ATTACHMENTS_ID,
    ID.unique(),
    {
      name: data.name,
      size: data.size,
      mimeType: data.mimeType,
      fileId: data.fileId,
      taskId: data.taskId,
      workspaceId: data.workspaceId,
      uploadedBy: data.uploadedBy,
      uploadedAt: new Date().toISOString(),
    }
  );  return attachment as Attachment;
};

export const deleteAttachment = async (attachmentId: string, workspaceId: string): Promise<void> => {
  const { databases, storage } = await createAdminClient();

  // First get the attachment to get the fileId
  const attachment = await databases.getDocument(
    DATABASE_ID,
    ATTACHMENTS_ID,
    attachmentId
  ) as Attachment;

  // Verify workspace access
  if (attachment.workspaceId !== workspaceId) {
    throw new Error("Unauthorized");
  }

  // Delete the file from storage
  try {
    await storage.deleteFile(ATTACHMENTS_BUCKET_ID, attachment.fileId);
  } catch (error) {
    console.error("Error deleting file from storage:", error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete the attachment record
  await databases.deleteDocument(
    DATABASE_ID,
    ATTACHMENTS_ID,
    attachmentId
  );
};