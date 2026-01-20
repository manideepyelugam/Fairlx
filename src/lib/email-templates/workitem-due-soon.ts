/**
 * Workitem Due Soon Email Template
 * 
 * Sent when a workitem is approaching its due date.
 */

import {
    colors,
    typography,
    createEmailWrapper,
    createPrimaryButton,
    createNotificationBadge,
    createAlertBox,
} from "./theme";

interface WorkitemDueSoonParams {
    taskName: string;
    taskUrl: string;
    dueDate: string;
    projectName?: string;
    assigneeName?: string;
    daysRemaining: number;
}

export function workitemDueSoonTemplate({
    taskName,
    taskUrl,
    dueDate,
    projectName,
    daysRemaining,
}: WorkitemDueSoonParams): string {
    const urgencyText = daysRemaining <= 1 ? "tomorrow" : `in ${daysRemaining} days`;

    let content = "";

    // Badge
    content += createNotificationBadge(
        "⏰",
        "Due Soon",
        colors.warningLight,
        colors.warningDark
    );

    // Heading
    content += `
    <h1 style="margin: 0 0 12px 0; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      ${taskName}
    </h1>
  `;

    // Summary
    content += `
    <p style="margin: 0 0 24px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      This task is due <strong style="color: ${colors.warning};">${urgencyText}</strong> (${dueDate}).
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

    // Alert box
    content += createAlertBox(
        "📋",
        "Action Required",
        "Please review this task and ensure it will be completed on time.",
        colors.warningLight,
        colors.warning,
        colors.warningDark
    );

    // CTA
    content += createPrimaryButton("View Task →", taskUrl);

    return createEmailWrapper(content, `${taskName} is due ${urgencyText}`);
}
