import { baseEmailTemplate, createButton } from "./base";
import { colors, typography, createNotificationBadge, createContentCard, createAlertBox } from "./theme";

interface TaskDueDateChangedTemplateProps {
  updaterName: string;
  taskName: string;
  oldDueDate?: string;
  newDueDate: string;
  projectName?: string;
  taskUrl: string;
}

export function taskDueDateChangedTemplate({
  updaterName,
  taskName,
  oldDueDate,
  newDueDate,
  projectName,
  taskUrl,
}: TaskDueDateChangedTemplateProps): string {
  const isExtended = oldDueDate && new Date(newDueDate) > new Date(oldDueDate);
  const daysUntilDue = Math.ceil((new Date(newDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

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
    ${createNotificationBadge(
    "📅",
    oldDueDate ? "Due Date Updated" : "Due Date Set",
    isDueSoon ? colors.errorLight : colors.primaryBlueLight,
    isDueSoon ? colors.errorDark : colors.primaryBlueDark
  )}

    <h2 style="margin: 0 0 20px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      Task due date has been ${oldDueDate ? 'changed' : 'set'}
    </h2>

    <p style="margin: 0 0 24px 0; color: ${colors.bodyText}; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      <strong style="color: ${colors.darkText};">${updaterName}</strong> has ${oldDueDate ? 'updated' : 'set'} the due date for:
    </p>

    ${createContentCard(taskCardContent, colors.primaryBlue)}

    <div style="background-color: ${colors.cardBackground}; border: 2px solid ${colors.borderColor}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      ${oldDueDate ? `
        <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
          <tr>
            <td style="width: 45%; text-align: center; padding: 16px;">
              <div style="margin-bottom: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.medium}; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${typography.fontStack};">
                Previous Due Date
              </div>
              <div style="color: ${colors.darkText}; font-size: ${typography.sizes.body}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">
                📅 ${new Date(oldDueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}
              </div>
            </td>
            <td style="width: 10%; text-align: center;">
              <div style="font-size: 24px; color: ${isExtended ? colors.success : colors.error};">
                →
              </div>
            </td>
            <td style="width: 45%; text-align: center; padding: 16px;">
              <div style="margin-bottom: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.medium}; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${typography.fontStack};">
                New Due Date
              </div>
              <div style="color: ${colors.darkText}; font-size: ${typography.sizes.body}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">
                📅 ${new Date(newDueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}
              </div>
            </td>
          </tr>
        </table>
      ` : `
        <div style="text-align: center; padding: 16px;">
          <div style="margin-bottom: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.medium}; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${typography.fontStack};">
            Due Date
          </div>
          <div style="color: ${colors.darkText}; font-size: ${typography.sizes.h3}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">
            📅 ${new Date(newDueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}
          </div>
          ${!isOverdue ? `
            <div style="margin-top: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; font-family: ${typography.fontStack};">
              ${daysUntilDue === 0 ? 'Due today' : daysUntilDue === 1 ? 'Due tomorrow' : `Due in ${daysUntilDue} days`}
            </div>
          ` : ''}
        </div>
      `}
    </div>

    ${isDueSoon && !isOverdue ? createAlertBox(
    "⏰",
    "Due Soon!",
    `This task is due ${daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}. ${oldDueDate && isExtended ? 'The deadline has been extended.' : 'Make sure to complete it on time.'}`,
    colors.errorLight,
    colors.error,
    colors.errorDark
  ) : ''}

    ${isOverdue ? createAlertBox(
    "⚠️",
    "Overdue Task",
    `This task was due ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'day' : 'days'} ago. Please prioritize completing it.`,
    colors.errorLight,
    colors.error,
    colors.errorDark
  ) : ''}

    ${createButton("View Task Details", taskUrl, isDueSoon || isOverdue ? colors.error : colors.primaryBlue)}

    <p style="margin: 20px 0 0 0; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.normal}; font-family: ${typography.fontStack};">
      ${isDueSoon || isOverdue ? 'Please review and update your schedule accordingly.' : 'Plan your work to meet this deadline.'}
    </p>
  `;

  return baseEmailTemplate(content, "Due Date Changed");
}

