/**
 * Workitem Mention Email Template
 * 
 * Sent when a user is mentioned in a comment on a workitem.
 */

import {
    colors,
    typography,
    createEmailWrapper,
    createPrimaryButton,
    createNotificationBadge,
    createContentCard,
} from "./theme";

interface WorkitemMentionParams {
    taskName: string;
    taskUrl: string;
    mentionerName: string;
    commentPreview: string;
    projectName?: string;
}

export function workitemMentionTemplate({
    taskName,
    taskUrl,
    mentionerName,
    commentPreview,
    projectName,
}: WorkitemMentionParams): string {
    // Truncate comment preview if too long
    const truncatedComment = commentPreview.length > 200
        ? commentPreview.substring(0, 200) + "..."
        : commentPreview;

    let content = "";

    // Badge
    content += createNotificationBadge(
        "💬",
        "You were mentioned",
        colors.infoLight,
        colors.infoDark
    );

    // Heading
    content += `
    <h1 style="margin: 0 0 12px 0; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      ${mentionerName} mentioned you
    </h1>
  `;

    // Task name
    content += `
    <p style="margin: 0 0 16px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      In a comment on <strong style="color: ${colors.primaryBlue};">${taskName}</strong>
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

    // Comment preview
    content += createContentCard(
        `<p style="margin: 0; font-size: ${typography.sizes.small}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack}; font-style: italic;">
      "${truncatedComment}"
    </p>`,
        colors.primaryBlue
    );

    // CTA
    content += createPrimaryButton("View Comment →", taskUrl);

    return createEmailWrapper(content, `${mentionerName} mentioned you on ${taskName}`);
}
