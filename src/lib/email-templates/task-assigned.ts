import { baseEmailTemplate, createButton, createBadge } from "./base";
import { colors, typography, createNotificationBadge, createContentCard, getPriorityColor as themePriorityColor } from "./theme";

interface TaskAssignedTemplateProps {
  assignerName: string;
  taskName: string;
  taskDescription?: string;
  projectName?: string;
  dueDate?: string;
  priority?: string;
  taskUrl: string;
}

export function taskAssignedTemplate({
  assignerName,
  taskName,
  taskDescription,
  projectName,
  dueDate,
  priority,
  taskUrl,
}: TaskAssignedTemplateProps): string {
  const taskCardContent = `
    <h3 style="margin: 0 0 12px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h3}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">
      ${taskName}
    </h3>
    ${taskDescription ? `
      <p style="margin: 0; color: ${colors.mutedText}; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
        ${taskDescription}
      </p>
    ` : ''}
  `;

  const content = `
    ${createNotificationBadge("📋", "New Task Assignment", colors.primaryBlueLight, colors.primaryBlueDark)}

    <h2 style="margin: 0 0 20px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      You've been assigned to a new task
    </h2>

    <p style="margin: 0 0 24px 0; color: ${colors.bodyText}; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      <strong style="color: ${colors.darkText};">${assignerName}</strong> has assigned you to the following task:
    </p>

    ${createContentCard(taskCardContent, colors.primaryBlue)}

    ${projectName || dueDate || priority ? `
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-bottom: 24px;">
        ${projectName ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderColor};">
              <span style="color: ${colors.mutedText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.medium}; font-family: ${typography.fontStack};">Project</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderColor}; text-align: right;">
              <span style="color: ${colors.darkText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">${projectName}</span>
            </td>
          </tr>
        ` : ''}
        ${dueDate ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderColor};">
              <span style="color: ${colors.mutedText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.medium}; font-family: ${typography.fontStack};">Due Date</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderColor}; text-align: right;">
              <span style="color: ${colors.darkText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">📅 ${new Date(dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}</span>
            </td>
          </tr>
        ` : ''}
        ${priority ? `
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: ${colors.mutedText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.medium}; font-family: ${typography.fontStack};">Priority</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              ${createBadge(priority, themePriorityColor(priority))}
            </td>
          </tr>
        ` : ''}
      </table>
    ` : ''}

    ${createButton("View Task Details", taskUrl)}

    <p style="margin: 20px 0 0 0; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.normal}; font-family: ${typography.fontStack};">
      Click the button above to view the complete task details and get started.
    </p>
  `;

  return baseEmailTemplate(content, "New Task Assignment");
}

