import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID } from "node-appwrite";

import { sessionMiddleware } from "@/lib/session-middleware";
import { ATTACHMENTS_BUCKET_ID, DATABASE_ID, ATTACHMENTS_ID } from "@/config";
import { getMember } from "@/features/members/utils";

import {
  deleteAttachmentSchema,
  getAttachmentsSchema,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from "../schemas";

import {
  getAttachments,
  createAttachment,
  deleteAttachment,
} from "../server/route";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", getAttachmentsSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { taskId, workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const attachments = await getAttachments(taskId, workspaceId);

      // Add URLs to attachments
      const storage = c.get("storage");
      const attachmentsWithUrls = await Promise.all(
        attachments.map(async (attachment) => ({
          ...attachment,
          url: storage.getFileView(ATTACHMENTS_BUCKET_ID, attachment.fileId).toString(),
        }))
      );

      return c.json({ data: attachmentsWithUrls });
    }
  )
  .post(
    "/upload",
    sessionMiddleware,
    async (c) => {
      try {
        const user = c.get("user");
        const databases = c.get("databases");
        const storage = c.get("storage");
        
        const body = await c.req.parseBody();
        
        const file = body.file as File;
        const taskId = body.taskId as string;
        const workspaceId = body.workspaceId as string;

        if (!file || !taskId || !workspaceId) {
          return c.json({ error: "Missing required fields" }, 400);
        }

        const member = await getMember({
          databases,
          workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return c.json({ error: "File size exceeds 50MB limit" }, 400);
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return c.json({ error: "File type not allowed" }, 400);
        }

        // Upload file to storage
        const fileId = ID.unique();
        const uploadedFile = await storage.createFile(
          ATTACHMENTS_BUCKET_ID,
          fileId,
          file
        );

        // Create attachment record
        const attachment = await createAttachment({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          fileId: uploadedFile.$id,
          taskId,
          workspaceId,
          uploadedBy: user.$id,
        });

        // Add URL to response
        const url = storage.getFileView(ATTACHMENTS_BUCKET_ID, attachment.fileId).toString();

        return c.json({
          data: {
            ...attachment,
            url,
          },
        });
      } catch (error) {
        console.error("Upload error:", error);
        return c.json({ error: "Failed to upload file" }, 500);
      }
    }
  )
  .delete(
    "/:attachmentId",
    sessionMiddleware,
    zValidator("query", deleteAttachmentSchema.pick({ workspaceId: true })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { attachmentId } = c.req.param();
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        await deleteAttachment(attachmentId, workspaceId);
        return c.json({ data: { success: true } });
      } catch (error) {
        console.error("Delete error:", error);
        return c.json({ error: "Failed to delete attachment" }, 500);
      }
    }
  )
  .get(
    "/:attachmentId/download",
    sessionMiddleware,
    zValidator("query", deleteAttachmentSchema.pick({ workspaceId: true })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const storage = c.get("storage");
      const { attachmentId } = c.req.param();
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        // Get attachment by ID
        const attachment = await databases.getDocument(
          DATABASE_ID,
          ATTACHMENTS_ID,
          attachmentId
        );
        
        if (!attachment || attachment.workspaceId !== workspaceId) {
          return c.json({ error: "Attachment not found" }, 404);
        }

        // Get file from storage and return it directly
        const file = await storage.getFileDownload(ATTACHMENTS_BUCKET_ID, attachment.fileId);
        
        // Return the file directly with proper headers
        return new Response(file, {
          headers: {
            'Content-Disposition': `attachment; filename="${attachment.name}"`,
            'Content-Type': attachment.mimeType || 'application/octet-stream',
          },
        });
      } catch (error) {
        console.error("Download error:", error);
        return c.json({ error: "Failed to download file" }, 500);
      }
    }
  )
  .get(
    "/:attachmentId/preview",
    sessionMiddleware,
    zValidator("query", deleteAttachmentSchema.pick({ workspaceId: true })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const storage = c.get("storage");
      const { attachmentId } = c.req.param();
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        // Get attachment by ID
        const attachment = await databases.getDocument(
          DATABASE_ID,
          ATTACHMENTS_ID,
          attachmentId
        );
        
        if (!attachment || attachment.workspaceId !== workspaceId) {
          return c.json({ error: "Attachment not found" }, 404);
        }

        // Get file from storage and return it directly for preview
        const file = await storage.getFileView(ATTACHMENTS_BUCKET_ID, attachment.fileId);
        
        // Return the file directly with proper headers for preview
        return new Response(file, {
          headers: {
            'Content-Type': attachment.mimeType || 'application/octet-stream',
          },
        });
      } catch (error) {
        console.error("Preview error:", error);
        return c.json({ error: "Failed to preview file" }, 500);
      }
    }
  );

export default app;