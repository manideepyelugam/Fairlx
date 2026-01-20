/**
 * Workitem Overdue Email Template
 * 
 * Sent when a workitem has passed its due date.
 */

import {
    colors,
    typography,
    createEmailWrapper,
    createPrimaryButton,
    createNotificationBadge,
    createAlertBox,
} from "./theme";

interface WorkitemOverdueParams {
    taskName: string;
    taskUrl: string;
    dueDate: string;
    projectName?: string;
    daysOverdue: number;
}

export function workitemOverdueTemplate({
    taskName,
    taskUrl,
    dueDate,
    projectName,
    daysOverdue,
}: WorkitemOverdueParams): string {
    const overdueText = daysOverdue === 1 ? "1 day ago" : `${daysOverdue} days ago`;

    let content = "";

    // Badge
    content += createNotificationBadge(
        "⚠️",
        "Overdue",
        colors.errorLight,
        colors.errorDark
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
      This task was due <strong style="color: ${colors.error};">${overdueText}</strong> (${dueDate}).
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
        "🚨",
        "Immediate Action Required",
        "This task has passed its due date. Please update the status or reschedule.",
        colors.errorLight,
        colors.error,
        colors.errorDark
    );

    // CTA
    content += createPrimaryButton("View Task →", taskUrl, colors.error);

    return createEmailWrapper(content, `⚠️ ${taskName} is overdue by ${overdueText}`);
}
