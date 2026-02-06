import { Member } from "@/features/members/types";

/**
 * Extracts mentioned user IDs from comment content
 * Mentions are in format @Username, @email@domain.com, or @Username[userId]
 */
export function extractMentions(
  content: string,
  members: Member[]
): string[] {
  const mentionedIds: string[] = [];

  // Match TipTap format: @name[userId] - extract userId directly
  const tiptapMentionRegex = /@[\w\s.-]+?\[([a-zA-Z0-9]+)\]/g;
  let match;

  while ((match = tiptapMentionRegex.exec(content)) !== null) {
    const userId = match[1];
    if (userId && !mentionedIds.includes(userId)) {
      mentionedIds.push(userId);
    }
  }

  // Also check plain @mentions (for backwards compatibility)
  const plainMentionRegex = /@([\w\s]+?)(?=\s|$|@)/g;
  while ((match = plainMentionRegex.exec(content)) !== null) {
    const mentionName = match[1]?.trim();
    if (mentionName) {
      const member = members.find(
        (m) =>
          m.name?.toLowerCase() === mentionName.toLowerCase() ||
          m.email?.toLowerCase() === mentionName.toLowerCase()
      );
      if (member && !mentionedIds.includes(member.userId)) {
        mentionedIds.push(member.userId);
      }
    }
  }

  return mentionedIds;
}

/**
 * Parses content and returns array of text parts and mention parts
 * Handles both TipTap format @name[id] and plain @name format
 */
export type ContentPart =
  | { type: "text"; content: string }
  | { type: "mention"; name: string; userId?: string };

export function parseContentWithMentions(
  content: string,
  members?: Member[]
): ContentPart[] {
  const parts: ContentPart[] = [];

  // Match @name[userId] format OR plain @name format
  // Group 1: name, Group 2: optional userId (inside brackets)
  const mentionRegex = /@([\w.-]+)(?:\[([a-zA-Z0-9]+)\])?/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex, match.index),
      });
    }

    const mentionName = match[1].trim();
    const mentionUserId = match[2]; // userId from brackets if present

    // Try to find member by userId first, then by name
    let member = null;
    if (mentionUserId) {
      member = members?.find((m) => m.userId === mentionUserId);
    }
    if (!member) {
      member = members?.find(
        (m) =>
          m.name?.toLowerCase() === mentionName.toLowerCase() ||
          m.email?.toLowerCase() === mentionName.toLowerCase()
      );
    }

    parts.push({
      type: "mention",
      name: member?.name || mentionName, // Use resolved name if available
      userId: mentionUserId || member?.userId,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.substring(lastIndex),
    });
  }

  // If no parts were added, return the entire content as text
  if (parts.length === 0) {
    parts.push({ type: "text", content });
  }

  return parts;
}

