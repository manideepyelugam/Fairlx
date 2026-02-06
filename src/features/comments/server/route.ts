import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COMMENTS_ID, TASKS_ID } from "@/config";
import { Comment, PopulatedComment, CommentAuthor } from "../types";
import { Query, ID } from "node-appwrite";
import { dispatchWorkitemEvent, createCommentAddedEvent, createMentionEvent } from "@/lib/notifications";
import { Task } from "@/features/tasks/types";
import { extractMentions, extractSnippet } from "@/lib/mentions";

// Get all comments for a task, optionally filtering by parentId
export const getComments = async (
  taskId: string,
  workspaceId: string
): Promise<Comment[]> => {
  const { databases } = await createAdminClient();

  if (!COMMENTS_ID) {
    throw new Error("COMMENTS_ID is not defined. Please check your environment variables.");
  }

  const comments = await databases.listDocuments(DATABASE_ID, COMMENTS_ID, [
    Query.equal("taskId", taskId),
    Query.equal("workspaceId", workspaceId),
    Query.orderAsc("$createdAt")
  ]);

  return comments.documents as Comment[];
};

// Get all comment authors from workspace members
export const getCommentAuthors = async (
  authorIds: string[]
): Promise<Map<string, CommentAuthor>> => {
  const { users } = await createAdminClient();
  const authorsMap = new Map<string, CommentAuthor>();

  // Get unique author IDs
  const uniqueAuthorIds = [...new Set(authorIds)];

  // Fetch user information for each author
  for (const authorId of uniqueAuthorIds) {
    try {
      // First try to get user details from Appwrite users
      const user = await users.get(authorId);
      authorsMap.set(authorId, {
        $id: user.$id,
        name: user.name || user.email || "Unknown",
        email: user.email,
        profileImageUrl: user.prefs?.profileImageUrl || null,
      });
    } catch {
      // If user not found, set a default
      authorsMap.set(authorId, {
        $id: authorId,
        name: "Unknown User",
        email: undefined,
        profileImageUrl: null,
      });
    }
  }

  return authorsMap;
};

// Create a new comment
export const createComment = async (data: {
  content: string;
  taskId: string;
  workspaceId: string;
  authorId: string;
  authorName?: string;
  parentId?: string;
}): Promise<Comment> => {
  const { databases } = await createAdminClient();

  const comment = await databases.createDocument(
    DATABASE_ID,
    COMMENTS_ID,
    ID.unique(),
    {
      content: data.content,
      taskId: data.taskId,
      workspaceId: data.workspaceId,
      authorId: data.authorId,
      isEdited: false,
      parentId: data.parentId || null,
    }
  );

  // Emit comment added event and mention events (non-blocking)
  try {
    const task = await databases.getDocument<Task>(
      DATABASE_ID,
      TASKS_ID,
      data.taskId
    );
    const authorName = data.authorName || "Someone";
    const mentionedUserIds = extractMentions(data.content);
    const snippet = extractSnippet(data.content);

    // console.log("[Comments] Creating comment, content:", data.content.slice(0, 200));
    // console.log("[Comments] Extracted mentions:", mentionedUserIds);

    // Dispatch comment added event with all mentioned users
    // Note: mentionedUserIds are passed to the event, and the dispatcher
    // handles creating notifications for mentioned users - no separate dispatch needed
    const event = createCommentAddedEvent(
      task,
      data.authorId,
      authorName,
      comment.$id,
      mentionedUserIds.length > 0 ? mentionedUserIds : undefined
    );
    dispatchWorkitemEvent(event).catch((err) => {
      console.error("[Comments] Failed to dispatch comment event:", err);
    });
  } catch (err) {
    console.error("[Comments] Error dispatching notifications:", err);
    // Silently fail - notifications are non-critical
  }

  return comment as Comment;
};

// Update an existing comment
export const updateComment = async (
  commentId: string,
  content: string,
  workspaceId: string,
  userId: string
): Promise<Comment> => {
  const { databases } = await createAdminClient();

  // First get the comment to verify ownership
  const existingComment = (await databases.getDocument(
    DATABASE_ID,
    COMMENTS_ID,
    commentId
  )) as Comment;

  // Verify workspace access
  if (existingComment.workspaceId !== workspaceId) {
    throw new Error("Unauthorized");
  }

  // Verify that the user is the author of the comment
  if (existingComment.authorId !== userId) {
    throw new Error("You can only edit your own comments");
  }

  const updatedComment = await databases.updateDocument(
    DATABASE_ID,
    COMMENTS_ID,
    commentId,
    {
      content,
      isEdited: true,
    }
  );

  return updatedComment as Comment;
};

// Delete a comment
export const deleteComment = async (
  commentId: string,
  workspaceId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<void> => {
  const { databases } = await createAdminClient();

  // First get the comment to verify ownership
  const existingComment = (await databases.getDocument(
    DATABASE_ID,
    COMMENTS_ID,
    commentId
  )) as Comment;

  // Verify workspace access
  if (existingComment.workspaceId !== workspaceId) {
    throw new Error("Unauthorized");
  }

  // Verify that the user is the author of the comment or an admin
  if (existingComment.authorId !== userId && !isAdmin) {
    throw new Error("You can only delete your own comments");
  }

  // Delete any replies to this comment first
  const replies = await databases.listDocuments(DATABASE_ID, COMMENTS_ID, [
    Query.equal("parentId", commentId),
  ]);

  for (const reply of replies.documents) {
    await databases.deleteDocument(DATABASE_ID, COMMENTS_ID, reply.$id);
  }

  // Delete the comment
  await databases.deleteDocument(DATABASE_ID, COMMENTS_ID, commentId);
};

// Get a single comment
export const getComment = async (commentId: string): Promise<Comment> => {
  const { databases } = await createAdminClient();

  const comment = await databases.getDocument(
    DATABASE_ID,
    COMMENTS_ID,
    commentId
  );

  return comment as Comment;
};

// Get comments with authors populated
export const getPopulatedComments = async (
  taskId: string,
  workspaceId: string
): Promise<PopulatedComment[]> => {
  const comments = await getComments(taskId, workspaceId);

  if (comments.length === 0) {
    return [];
  }

  // Get all author IDs
  const authorIds = comments.map((c) => c.authorId);
  const authorsMap = await getCommentAuthors(authorIds);

  // Separate root comments and replies
  const rootComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  // Map comments with authors and organize replies
  const populatedComments: PopulatedComment[] = rootComments.map((comment) => {
    const commentReplies = replies
      .filter((r) => r.parentId === comment.$id)
      .map((reply) => ({
        ...reply,
        author: authorsMap.get(reply.authorId),
        replies: [],
      }));

    return {
      ...comment,
      author: authorsMap.get(comment.authorId),
      replies: commentReplies,
    };
  });

  return populatedComments;
};
