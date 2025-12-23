import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";

import { 
  loginSchema, 
  registerSchema, 
  updateProfileSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { ID, ImageFormat, Client, Account, Query } from "node-appwrite";
import { AUTH_COOKIE } from "../constants";
import { sessionMiddleware } from "@/lib/session-middleware";
import { 
  IMAGES_BUCKET_ID,
  DATABASE_ID,
  WORKSPACES_ID,
  SPACES_ID,
  PROJECTS_ID,
  TASKS_ID,
  MEMBERS_ID,
  SPACE_MEMBERS_ID,
  TIME_LOGS_ID,
  CUSTOM_COLUMNS_ID,
  DEFAULT_COLUMN_SETTINGS_ID,
  NOTIFICATIONS_ID,
  SUBTASKS_ID,
  ATTACHMENTS_ID,
  ATTACHMENTS_BUCKET_ID,
  COMMENTS_ID,
  GITHUB_REPOS_ID,
  PROJECT_DOCS_ID,
  PROJECT_DOCS_BUCKET_ID,
  TEAMS_ID,
  TEAM_MEMBERS_ID,
  PROGRAMS_ID,
  CUSTOM_ROLES_ID,
  PROJECT_MEMBERS_ID,
  PROJECT_ROLES_ID,
  WORKFLOWS_ID,
  WORKFLOW_STATUSES_ID,
  WORKFLOW_TRANSITIONS_ID,
  CUSTOM_FIELDS_ID,
  CUSTOM_WORK_ITEM_TYPES_ID,
  WORK_ITEM_LINKS_ID,
  SAVED_VIEWS_ID,
  SPRINTS_ID,
  WORK_ITEMS_ID,
  PERSONAL_BACKLOG_ID,
} from "@/config";

const app = new Hono()
  .get("/current", sessionMiddleware, (c) => {
    const user = c.get("user");

    return c.json({ data: user });
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const { account } = await createAdminClient();
    
    try {
      // First, try to create a session to validate credentials
      const session = await account.createEmailPasswordSession(email, password);
      
      // Set the session to check user details
      const tempClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setSession(session.secret);
      
      const tempAccount = new Account(tempClient);
      const user = await tempAccount.get();
      
      // Check if email is verified
      if (!user.emailVerification) {
        // Delete the session since email is not verified
        await tempAccount.deleteSession("current");
        return c.json({ 
          error: "Please verify your email before logging in. Check your inbox for the verification link.",
          needsVerification: true,
          email: email
        }, 400);
      }

      // Email is verified, set the cookie
      setCookie(c, AUTH_COOKIE, session.secret, {
        path: "/",
        httpOnly: true,
        secure: false, // Set to true when using HTTPS
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return c.json({ success: true });
    } catch (error: unknown) {
      const appwriteError = error as { code?: number };
      if (appwriteError.code === 401) {
        return c.json({ error: "Invalid email or password" }, 401);
      }
      throw error;
    }
  })
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { name, email, password } = c.req.valid("json");

    try {
      const { account } = await createAdminClient();
      
      // Create user account
      const user = await account.create(ID.unique(), email, password, name);
      
      // Create a temporary session to send verification email
      const session = await account.createEmailPasswordSession(email, password);
      
      // Create a new client with the user session to send verification
      const userClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setSession(session.secret);
      
      const userAccount = new Account(userClient);
      
      // Send email verification using user session
      await userAccount.createVerification(
        `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
      );
      
      // Delete the temporary session since email is not verified yet
      await userAccount.deleteSession("current");

      return c.json({ 
        success: true, 
        message: "Registration successful! Please check your email to verify your account.",
        userId: user.$id 
      });
    } catch (error: unknown) {
      console.error("Registration error:", error);
      const appwriteError = error as { code?: number; message?: string; type?: string };
      
      if (appwriteError.code === 409) {
        return c.json({ error: "A user with this email already exists." }, 409);
      }
      
      // Check for SMTP configuration issues during registration
      if (appwriteError.type === "general_smtp_disabled" || 
          (appwriteError.message && appwriteError.message.toLowerCase().includes("smtp"))) {
        return c.json({ 
          error: "Account created but verification email could not be sent. Please contact support.",
          smtpError: true
        }, 500);
      }
      
      if (appwriteError.message) {
        return c.json({ error: `Registration failed: ${appwriteError.message}` }, 500);
      }
      
      return c.json({ error: "Registration failed. Please try again." }, 500);
    }
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
  })
  .patch(
    "/change-password",
    sessionMiddleware,
    zValidator("json", changePasswordSchema),
    async (c) => {
      try {
        const account = c.get("account");
        const { currentPassword, newPassword } = c.req.valid("json");

        // Update password using Appwrite's updatePassword method
        await account.updatePassword(newPassword, currentPassword);

        return c.json({ success: true, message: "Password updated successfully" });
      } catch (error: unknown) {
        console.error("Change password error:", error);
        
        // Handle Appwrite specific errors
        const appwriteError = error as { type?: string; message?: string };
        
        if (appwriteError.type === "user_invalid_credentials") {
          return c.json({ error: "Current password is incorrect" }, 400);
        }
        
        if (appwriteError.type === "user_password_recently_used") {
          return c.json({ error: "Please choose a different password" }, 400);
        }
        
        return c.json({ 
          error: appwriteError.message || "Failed to change password. Please try again." 
        }, 500);
      }
    }
  )
  .post("/verify-email", zValidator("json", verifyEmailSchema), async (c) => {
    const { userId, secret } = c.req.valid("json");

    try {
      // Create a lightweight client without admin credentials because verification
      // is performed against the public Account API using the secret from the email.
      const verificationClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

      const account = new Account(verificationClient);

      // Verify the email using the secret from the verification link
      await account.updateVerification(userId, secret);

      return c.json({ 
        success: true, 
        message: "Email verified successfully! You can now log in." 
      });
    } catch (error: unknown) {
      const appwriteError = error as { code?: number; type?: string; message?: string };
      if (appwriteError.code === 401) {
        return c.json({ error: "Invalid or expired verification link" }, 400);
      }
      if (appwriteError.code === 404) {
        return c.json({ error: "Verification link not found or already used" }, 400);
      }
      if (appwriteError.code === 500 && appwriteError.type === "general_argument_invalid") {
        return c.json({ error: "Verification request was rejected by Appwrite. Please request a new link." }, 400);
      }
      return c.json({ error: "Failed to verify email: " + (appwriteError.message || "Unknown error") }, 500);
    }
  })
  .post("/resend-verification", zValidator("json", resendVerificationSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const { account } = await createAdminClient();
      
      // Create a temporary session to check user status and send verification
      const session = await account.createEmailPasswordSession(email, password);
      
      // Create user client with session
      const userClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setSession(session.secret);
      
      const userAccount = new Account(userClient);
      const user = await userAccount.get();
      
      if (user.emailVerification) {
        await userAccount.deleteSession("current");
        return c.json({ error: "Email is already verified. You can log in normally." }, 400);
      }
      
      // Send verification email
      await userAccount.createVerification(
        `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
      );
      
      // Delete the temporary session
      await userAccount.deleteSession("current");
      
      return c.json({ 
        success: true, 
        message: "Verification email sent! Please check your inbox and click the verification link." 
      });
    } catch (error: unknown) {
      console.error("Resend verification error:", error);
      const appwriteError = error as { code?: number; message?: string; type?: string };
      
      if (appwriteError.code === 401) {
        return c.json({ error: "Invalid email or password." }, 401);
      }
      
      if (appwriteError.code === 404) {
        return c.json({ error: "User not found." }, 404);
      }
      
      if (appwriteError.code === 429) {
        return c.json({ error: "Too many requests. Please wait before trying again." }, 429);
      }
      
      // Check for SMTP configuration issues
      if (appwriteError.type === "general_smtp_disabled" || 
          (appwriteError.message && appwriteError.message.toLowerCase().includes("smtp"))) {
        return c.json({ 
          error: "Email service is not configured. Please contact support to set up SMTP configuration.",
          smtpError: true
        }, 500);
      }
      
      if (appwriteError.message) {
        return c.json({ error: `Failed to send verification email: ${appwriteError.message}` }, 500);
      }
      
      return c.json({ error: "Failed to send verification email. Please try again." }, 500);
    }
  })
  .post("/forgot-password", zValidator("json", forgotPasswordSchema), async (c) => {
    const { email } = c.req.valid("json");

    try {
      const { account } = await createAdminClient();
      
      // Send password recovery email
      await account.createRecovery(
        email,
        `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      );
      
      return c.json({ 
        success: true, 
        message: "Password recovery email sent! Please check your inbox." 
      });
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      const appwriteError = error as { code?: number; message?: string; type?: string };
      
      // Check for SMTP configuration issues
      if (appwriteError.type === "general_smtp_disabled" || 
          (appwriteError.message && appwriteError.message.toLowerCase().includes("smtp"))) {
        return c.json({ 
          error: "Email service is not configured. Please contact support.",
          smtpError: true
        }, 500);
      }
      
      if (appwriteError.code === 404) {
        return c.json({ error: "User not found." }, 404);
      }
      
      if (appwriteError.code === 429) {
        return c.json({ error: "Too many requests. Please wait before trying again." }, 429);
      }
      
      return c.json({ error: "Failed to send recovery email. Please try again." }, 500);
    }
  })
  .post("/reset-password", zValidator("json", resetPasswordSchema), async (c) => {
    const { userId, secret, password } = c.req.valid("json");

    try {
      const { account } = await createAdminClient();
      
      // Reset the password
      await account.updateRecovery(userId, secret, password);
      
      return c.json({ 
        success: true, 
        message: "Password reset successfully! You can now log in with your new password." 
      });
    } catch (error: unknown) {
      const appwriteError = error as { code?: number };
      if (appwriteError.code === 401) {
        return c.json({ error: "Invalid or expired recovery link" }, 400);
      }
      return c.json({ error: "Failed to reset password" }, 500);
    }
  })
  .delete("/account", sessionMiddleware, async (c) => {
    try {
      const account = c.get("account");
      const storage = c.get("storage");
      const databases = c.get("databases");
      const user = c.get("user");
      const { users } = await createAdminClient();

      console.log(`Starting account deletion for user: ${user.$id}`);

      // Get all workspaces owned by the user
      const ownedWorkspaces = await databases.listDocuments(
        DATABASE_ID,
        WORKSPACES_ID,
        [Query.equal("userId", user.$id)]
      );

      console.log(`Found ${ownedWorkspaces.total} workspaces to delete`);

      // Delete each owned workspace and all related data
      for (const workspace of ownedWorkspaces.documents) {
        const workspaceId = workspace.$id;
        console.log(`Deleting workspace: ${workspaceId}`);

        try {
          // Get all spaces in this workspace
          const spaces = await databases.listDocuments(
            DATABASE_ID,
            SPACES_ID,
            [Query.equal("workspaceId", workspaceId)]
          );

          // Delete all spaces and their related data
          for (const space of spaces.documents) {
            console.log(`Deleting space: ${space.$id}`);
            
            // Delete space members
            const spaceMembers = await databases.listDocuments(
              DATABASE_ID,
              SPACE_MEMBERS_ID,
              [Query.equal("spaceId", space.$id)]
            );
            for (const sm of spaceMembers.documents) {
              await databases.deleteDocument(DATABASE_ID, SPACE_MEMBERS_ID, sm.$id);
            }

            // Delete the space
            await databases.deleteDocument(DATABASE_ID, SPACES_ID, space.$id);
          }

          // Get all projects in this workspace
          const projects = await databases.listDocuments(
            DATABASE_ID,
            PROJECTS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );

          // Delete all projects and their related data
          for (const project of projects.documents) {
            console.log(`Deleting project: ${project.$id}`);

            // Delete project members
            const projectMembers = await databases.listDocuments(
              DATABASE_ID,
              PROJECT_MEMBERS_ID,
              [Query.equal("projectId", project.$id)]
            );
            for (const pm of projectMembers.documents) {
              await databases.deleteDocument(DATABASE_ID, PROJECT_MEMBERS_ID, pm.$id);
            }

            // Delete project roles
            const projectRoles = await databases.listDocuments(
              DATABASE_ID,
              PROJECT_ROLES_ID,
              [Query.equal("projectId", project.$id)]
            );
            for (const pr of projectRoles.documents) {
              await databases.deleteDocument(DATABASE_ID, PROJECT_ROLES_ID, pr.$id);
            }

            // Delete project docs
            const projectDocs = await databases.listDocuments(
              DATABASE_ID,
              PROJECT_DOCS_ID,
              [Query.equal("projectId", project.$id)]
            );
            for (const doc of projectDocs.documents) {
              // Delete document file from storage
              if (doc.fileId) {
                try {
                  await storage.deleteFile(PROJECT_DOCS_BUCKET_ID, doc.fileId);
                } catch (error) {
                  console.error(`Failed to delete document file: ${doc.fileId}`, error);
                }
              }
              await databases.deleteDocument(DATABASE_ID, PROJECT_DOCS_ID, doc.$id);
            }

            // Delete GitHub repos linked to project
            const githubRepos = await databases.listDocuments(
              DATABASE_ID,
              GITHUB_REPOS_ID,
              [Query.equal("projectId", project.$id)]
            );
            for (const repo of githubRepos.documents) {
              await databases.deleteDocument(DATABASE_ID, GITHUB_REPOS_ID, repo.$id);
            }
          }

          // Get all tasks in this workspace
          const tasks = await databases.listDocuments(
            DATABASE_ID,
            TASKS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );

          // Delete all task-related data
          for (const task of tasks.documents) {
            // Delete subtasks
            const subtasks = await databases.listDocuments(
              DATABASE_ID,
              SUBTASKS_ID,
              [Query.equal("taskId", task.$id)]
            );
            for (const subtask of subtasks.documents) {
              await databases.deleteDocument(DATABASE_ID, SUBTASKS_ID, subtask.$id);
            }

            // Delete comments
            const comments = await databases.listDocuments(
              DATABASE_ID,
              COMMENTS_ID,
              [Query.equal("taskId", task.$id)]
            );
            for (const comment of comments.documents) {
              await databases.deleteDocument(DATABASE_ID, COMMENTS_ID, comment.$id);
            }

            // Delete attachments
            const attachments = await databases.listDocuments(
              DATABASE_ID,
              ATTACHMENTS_ID,
              [Query.equal("taskId", task.$id)]
            );
            for (const attachment of attachments.documents) {
              // Delete attachment file from storage
              if (attachment.fileId) {
                try {
                  await storage.deleteFile(ATTACHMENTS_BUCKET_ID, attachment.fileId);
                } catch (error) {
                  console.error(`Failed to delete attachment file: ${attachment.fileId}`, error);
                }
              }
              await databases.deleteDocument(DATABASE_ID, ATTACHMENTS_ID, attachment.$id);
            }

            // Delete work item links
            const workItemLinks = await databases.listDocuments(
              DATABASE_ID,
              WORK_ITEM_LINKS_ID,
              [Query.equal("sourceTaskId", task.$id)]
            );
            for (const link of workItemLinks.documents) {
              await databases.deleteDocument(DATABASE_ID, WORK_ITEM_LINKS_ID, link.$id);
            }

            // Delete the task
            await databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id);
          }

          // Delete time logs
          const timeLogs = await databases.listDocuments(
            DATABASE_ID,
            TIME_LOGS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const timeLog of timeLogs.documents) {
            await databases.deleteDocument(DATABASE_ID, TIME_LOGS_ID, timeLog.$id);
          }

          // Delete sprints
          const sprints = await databases.listDocuments(
            DATABASE_ID,
            SPRINTS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const sprint of sprints.documents) {
            await databases.deleteDocument(DATABASE_ID, SPRINTS_ID, sprint.$id);
          }

          // Delete work items
          const workItems = await databases.listDocuments(
            DATABASE_ID,
            WORK_ITEMS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const workItem of workItems.documents) {
            await databases.deleteDocument(DATABASE_ID, WORK_ITEMS_ID, workItem.$id);
          }

          // Delete workflows
          const workflows = await databases.listDocuments(
            DATABASE_ID,
            WORKFLOWS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const workflow of workflows.documents) {
            // Delete workflow statuses
            const statuses = await databases.listDocuments(
              DATABASE_ID,
              WORKFLOW_STATUSES_ID,
              [Query.equal("workflowId", workflow.$id)]
            );
            for (const status of statuses.documents) {
              await databases.deleteDocument(DATABASE_ID, WORKFLOW_STATUSES_ID, status.$id);
            }

            // Delete workflow transitions
            const transitions = await databases.listDocuments(
              DATABASE_ID,
              WORKFLOW_TRANSITIONS_ID,
              [Query.equal("workflowId", workflow.$id)]
            );
            for (const transition of transitions.documents) {
              await databases.deleteDocument(DATABASE_ID, WORKFLOW_TRANSITIONS_ID, transition.$id);
            }

            await databases.deleteDocument(DATABASE_ID, WORKFLOWS_ID, workflow.$id);
          }

          // Delete custom fields
          const customFields = await databases.listDocuments(
            DATABASE_ID,
            CUSTOM_FIELDS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const field of customFields.documents) {
            await databases.deleteDocument(DATABASE_ID, CUSTOM_FIELDS_ID, field.$id);
          }

          // Delete custom work item types
          const customWorkItemTypes = await databases.listDocuments(
            DATABASE_ID,
            CUSTOM_WORK_ITEM_TYPES_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const type of customWorkItemTypes.documents) {
            await databases.deleteDocument(DATABASE_ID, CUSTOM_WORK_ITEM_TYPES_ID, type.$id);
          }

          // Delete saved views
          const savedViews = await databases.listDocuments(
            DATABASE_ID,
            SAVED_VIEWS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const view of savedViews.documents) {
            await databases.deleteDocument(DATABASE_ID, SAVED_VIEWS_ID, view.$id);
          }

          // Delete custom columns
          const customColumns = await databases.listDocuments(
            DATABASE_ID,
            CUSTOM_COLUMNS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const column of customColumns.documents) {
            await databases.deleteDocument(DATABASE_ID, CUSTOM_COLUMNS_ID, column.$id);
          }

          // Delete default column settings
          const defaultColumnSettings = await databases.listDocuments(
            DATABASE_ID,
            DEFAULT_COLUMN_SETTINGS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const setting of defaultColumnSettings.documents) {
            await databases.deleteDocument(DATABASE_ID, DEFAULT_COLUMN_SETTINGS_ID, setting.$id);
          }

          // Delete teams
          const teams = await databases.listDocuments(
            DATABASE_ID,
            TEAMS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const team of teams.documents) {
            // Delete team members
            const teamMembers = await databases.listDocuments(
              DATABASE_ID,
              TEAM_MEMBERS_ID,
              [Query.equal("teamId", team.$id)]
            );
            for (const tm of teamMembers.documents) {
              await databases.deleteDocument(DATABASE_ID, TEAM_MEMBERS_ID, tm.$id);
            }
            await databases.deleteDocument(DATABASE_ID, TEAMS_ID, team.$id);
          }

          // Delete programs
          const programs = await databases.listDocuments(
            DATABASE_ID,
            PROGRAMS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const program of programs.documents) {
            await databases.deleteDocument(DATABASE_ID, PROGRAMS_ID, program.$id);
          }

          // Delete custom roles
          const customRoles = await databases.listDocuments(
            DATABASE_ID,
            CUSTOM_ROLES_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const role of customRoles.documents) {
            await databases.deleteDocument(DATABASE_ID, CUSTOM_ROLES_ID, role.$id);
          }

          // Delete all projects (after related data is deleted)
          for (const project of projects.documents) {
            await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, project.$id);
          }

          // Delete workspace members
          const members = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [Query.equal("workspaceId", workspaceId)]
          );
          for (const member of members.documents) {
            await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, member.$id);
          }

          // Finally delete the workspace
          await databases.deleteDocument(DATABASE_ID, WORKSPACES_ID, workspaceId);
          console.log(`Successfully deleted workspace: ${workspaceId}`);
        } catch (error) {
          console.error(`Error deleting workspace ${workspaceId}:`, error);
          // Continue with other workspaces even if one fails
        }
      }

      // Delete user's personal backlog items
      try {
        const personalBacklog = await databases.listDocuments(
          DATABASE_ID,
          PERSONAL_BACKLOG_ID,
          [Query.equal("userId", user.$id)]
        );
        for (const item of personalBacklog.documents) {
          await databases.deleteDocument(DATABASE_ID, PERSONAL_BACKLOG_ID, item.$id);
        }
      } catch (error) {
        console.error("Error deleting personal backlog:", error);
      }

      // Delete user's notifications
      try {
        const notifications = await databases.listDocuments(
          DATABASE_ID,
          NOTIFICATIONS_ID,
          [Query.equal("userId", user.$id)]
        );
        for (const notification of notifications.documents) {
          await databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_ID, notification.$id);
        }
      } catch (error) {
        console.error("Error deleting notifications:", error);
      }

      // Delete profile image if exists
      if (user.prefs?.profileImageId) {
        try {
          await storage.deleteFile(IMAGES_BUCKET_ID, user.prefs.profileImageId);
        } catch (error) {
          console.error("Error deleting profile image:", error);
        }
      }

      // Delete all user sessions
      await account.deleteSessions();

      // Delete the user account (requires admin client)
      await users.delete(user.$id);

      // Clear auth cookie
      deleteCookie(c, AUTH_COOKIE);

      console.log(`Successfully deleted user account: ${user.$id}`);

      return c.json({ 
        success: true, 
        message: "Account and all associated data deleted successfully" 
      });
    } catch (error: unknown) {
      console.error("Delete account error:", error);
      const appwriteError = error as { code?: number; message?: string };
      
      if (appwriteError.code === 401) {
        return c.json({ error: "Unauthorized. Please log in again." }, 401);
      }
      
      return c.json({ 
        error: appwriteError.message || "Failed to delete account. Please try again." 
      }, 500);
    }
  });

export default app;
