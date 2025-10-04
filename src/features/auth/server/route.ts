import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";

import { loginSchema, registerSchema, updateProfileSchema } from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { ID, ImageFormat } from "node-appwrite";
import { AUTH_COOKIE } from "../constants";
import { sessionMiddleware } from "@/lib/session-middleware";
import { IMAGES_BUCKET_ID } from "@/config";

const app = new Hono()
  .get("/current", sessionMiddleware, (c) => {
    const user = c.get("user");

    return c.json({ data: user });
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    setCookie(c, AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
    });

    return c.json({ success: true });
  })
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { name, email, password } = c.req.valid("json");

    const { account } = await createAdminClient();
    await account.create(ID.unique(), email, password, name);

    const session = await account.createEmailPasswordSession(email, password);

    setCookie(c, AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
    });

    return c.json({ success: true });
  })
  .post("/logout", sessionMiddleware, async (c) => {
    const account = c.get("account");

    deleteCookie(c, AUTH_COOKIE);
    await account.deleteSession("current");

    return c.json({ success: true });
  })
  .patch(
    "/profile",
    sessionMiddleware,
    zValidator("json", updateProfileSchema),
    async (c) => {
      const account = c.get("account");
      const { name } = c.req.valid("json");

      const user = await account.updateName(name);

      return c.json({ data: user });
    }
  )
  .post("/profile-image", sessionMiddleware, zValidator("form", z.object({ file: z.instanceof(File) })), async (c) => {
    try {
      const account = c.get("account");
      const storage = c.get("storage");
      const user = c.get("user");
      
      // Get validated file from form data
      const { file } = c.req.valid("form");

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return c.json({ error: "File size too large. Maximum 2MB allowed." }, 400);
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return c.json({ error: "Invalid file type. Only images are allowed." }, 400);
      }

      // Delete old profile image if exists
      if (user.prefs?.profileImageId) {
        try {
          await storage.deleteFile(IMAGES_BUCKET_ID, user.prefs.profileImageId);
        } catch {
          // Ignore error if file doesn't exist
        }
      }

      // Upload new profile image
      const uploadedFile = await storage.createFile(
        IMAGES_BUCKET_ID,
        ID.unique(),
        file
      );

      // Get optimized preview URL to keep prefs payload small
      const previewArrayBuffer = await storage.getFilePreview(
        IMAGES_BUCKET_ID,
        uploadedFile.$id,
        256,
        256,
        undefined,
        80,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        ImageFormat.Webp
      );

      const base64 = Buffer.from(previewArrayBuffer).toString("base64");
      const fileUrl = `data:image/webp;base64,${base64}`;

      // Safely extract and sanitize existing preferences
      let currentPrefs = {};
      if (user?.prefs && typeof user.prefs === "object" && !Array.isArray(user.prefs)) {
        // Filter out undefined, null values and functions
        currentPrefs = Object.fromEntries(
          Object.entries(user.prefs).filter(([, value]) => 
            value !== undefined && 
            value !== null && 
            typeof value !== "function"
          )
        );
      }

      // Update user preferences with new image URL and ID
      await account.updatePrefs({
        ...currentPrefs,
        profileImageUrl: fileUrl,
        profileImageId: uploadedFile.$id,
        profileImageMimeType: "image/webp",
        profileImageUpdatedAt: new Date().toISOString(),
      });

      return c.json({ data: { url: fileUrl } });
    } catch (error) {
      
      // Return more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          return c.json({ error: "Storage service error: " + error.message }, 500);
        }
        if (error.message.includes('account')) {
          return c.json({ error: "Account service error: " + error.message }, 500);
        }
        return c.json({ error: error.message }, 500);
      }
      
      return c.json({ error: "Failed to upload profile image" }, 500);
    }
  });

export default app;
