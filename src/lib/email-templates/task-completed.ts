import { baseEmailTemplate, createButton } from "./base";
import { colors, typography, createNotificationBadge } from "./theme";

interface TaskCompletedTemplateProps {
  completerName: string;
  taskName: string;
  taskDescription?: string;
  projectName?: string;
  completedAt?: string;
  taskUrl: string;
}

export function taskCompletedTemplate({
  completerName,
  taskName,
  taskDescription,
  projectName,
  completedAt,
  taskUrl,
}: TaskCompletedTemplateProps): string {
  const content = `
    ${createNotificationBadge("✅", "Task Completed", colors.successLight, colors.successDark)}

    <h2 style="margin: 0 0 20px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      Great news! A task has been completed
    </h2>

    <p style="margin: 0 0 24px 0; color: ${colors.bodyText}; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      <strong style="color: ${colors.darkText};">${completerName}</strong> has marked this task as complete:
    </p>

    <div style="background: linear-gradient(135deg, ${colors.successLight} 0%, #a7f3d0 100%); border-left: 4px solid ${colors.success}; padding: 24px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
        <tr>
          <td style="width: 44px; vertical-align: top;">
            <div style="font-size: 32px;">🎉</div>
          </td>
          <td style="vertical-align: top;">
            <h3 style="margin: 0 0 8px 0; color: ${colors.successDark}; font-size: ${typography.sizes.h3}; font-weight: ${typography.weights.bold}; font-family: ${typography.fontStack};">
              ${taskName}
            </h3>
            ${taskDescription ? `
              <p style="margin: 0; color: #047857; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
                ${taskDescription}
              </p>
            ` : ''}
          </td>
        </tr>
      </table>
    </div>

    ${projectName || completedAt ? `
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-bottom: 24px; background-color: ${colors.backgroundLight}; border-radius: 8px;">
        ${projectName ? `
          <tr>
            <td style="padding: 12px 16px;">
              <span style="color: ${colors.mutedText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.medium}; font-family: ${typography.fontStack};">📁 Project</span>
            </td>
            <td style="padding: 12px 16px; text-align: right;">
              <span style="color: ${colors.darkText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">${projectName}</span>
            </td>
          </tr>
        ` : ''}
        ${completedAt ? `
          <tr>
            <td style="padding: 12px 16px;">
              <span style="color: ${colors.mutedText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.medium}; font-family: ${typography.fontStack};">✓ Completed</span>
            </td>
            <td style="padding: 12px 16px; text-align: right;">
              <span style="color: ${colors.darkText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">${new Date(completedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</span>
            </td>
          </tr>
        ` : ''}
      </table>
    ` : ''}

    ${createButton("View Task", taskUrl, colors.success)}

    <p style="margin: 20px 0 0 0; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.normal}; font-family: ${typography.fontStack};">
      Keep up the great work! Your team is making excellent progress.
    </p>
  `;

  return baseEmailTemplate(content, "Task Completed");
}

