import { baseEmailTemplate, createButton, createBadge, getStatusColor, formatStatus } from "./base";
import { colors, typography, createNotificationBadge, createContentCard } from "./theme";

interface TaskStatusChangedTemplateProps {
  updaterName: string;
  taskName: string;
  oldStatus: string;
  newStatus: string;
  projectName?: string;
  taskUrl: string;
}

export function taskStatusChangedTemplate({
  updaterName,
  taskName,
  oldStatus,
  newStatus,
  projectName,
  taskUrl,
}: TaskStatusChangedTemplateProps): string {
  const taskCardContent = `
    <h3 style="margin: 0 0 8px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h3}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">
      ${taskName}
    </h3>
    ${projectName ? `
      <p style="margin: 0; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; font-family: ${typography.fontStack};">
        Project: <strong style="color: ${colors.darkText};">${projectName}</strong>
      </p>
    ` : ''}
  `;

  const content = `
    ${createNotificationBadge("🔄", "Status Update", colors.warningLight, colors.warningDark)}

    <h2 style="margin: 0 0 20px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      Task status has been updated
    </h2>

    <p style="margin: 0 0 24px 0; color: ${colors.bodyText}; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      <strong style="color: ${colors.darkText};">${updaterName}</strong> has updated the status of:
    </p>

    ${createContentCard(taskCardContent, colors.warning)}

    <div style="background-color: ${colors.cardBackground}; border: 2px solid ${colors.borderColor}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
        <tr>
          <td style="width: 45%; text-align: center; padding: 16px;">
            <div style="margin-bottom: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.medium}; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${typography.fontStack};">
              Previous Status
            </div>
            ${createBadge(formatStatus(oldStatus), getStatusColor(oldStatus))}
          </td>
          <td style="width: 10%; text-align: center;">
            <div style="font-size: 24px; color: ${colors.primaryBlue};">
              →
            </div>
          </td>
          <td style="width: 45%; text-align: center; padding: 16px;">
            <div style="margin-bottom: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.medium}; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${typography.fontStack};">
              New Status
            </div>
            ${createBadge(formatStatus(newStatus), getStatusColor(newStatus))}
          </td>
        </tr>
      </table>
    </div>

    ${createButton("View Task Details", taskUrl)}

    <p style="margin: 20px 0 0 0; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.normal}; font-family: ${typography.fontStack};">
      Stay updated on task progress and collaborate with your team.
    </p>
  `;

  return baseEmailTemplate(content, "Task Status Updated");
}

