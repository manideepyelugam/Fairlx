/**
 * Comment Reply Email Template
 * 
 * Sent when someone replies to a user's comment on a task.
 */

import {
    colors,
    typography,
    createEmailWrapper,
    createPrimaryButton,
    createNotificationBadge,
    createContentCard,
} from "./theme";

interface CommentReplyParams {
    taskName: string;
    taskUrl: string;
    replierName: string;
    replyContent: string;
    projectName?: string;
}

export function commentReplyTemplate({
    taskName,
    taskUrl,
    replierName,
    replyContent,
    projectName,
}: CommentReplyParams): string {
    const truncatedReply = replyContent.length > 250
        ? replyContent.substring(0, 250) + "..."
        : replyContent;

    let content = "";

    // Badge
    content += createNotificationBadge(
        "↩️",
        "Reply to your comment",
        "#f0f9ff",
        "#0369a1"
    );

    // Heading
    content += `
    <h1 style="margin: 0 0 12px 0; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      ${replierName} replied to your comment
    </h1>
  `;

    // Task context
    content += `
    <p style="margin: 0 0 16px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      On task <strong style="color: ${colors.primaryBlue};">${taskName}</strong>
    </p>
  `;

    // Project context
    if (projectName) {
        content += `
      <p style="margin: 0 0 24px 0; font-size: ${typography.sizes.small}; color: ${colors.mutedText}; font-family: ${typography.fontStack};">
        Project: <strong style="color: ${colors.darkText};">${projectName}</strong>
      </p>
    `;
    }

    // Reply content
    content += createContentCard(
        `<p style="margin: 0; font-size: ${typography.sizes.small}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack}; font-style: italic;">
      "${truncatedReply}"
    </p>`,
        "#0ea5e9"
    );

    // CTA
    content += createPrimaryButton("View Reply →", taskUrl);

    return createEmailWrapper(content, `${replierName} replied to your comment on ${taskName}`);
}
