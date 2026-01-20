import { baseEmailTemplate, createButton, createBadge, getPriorityColor } from "./base";
import { colors, typography, createNotificationBadge, createContentCard, createAlertBox } from "./theme";

interface TaskPriorityChangedTemplateProps {
  updaterName: string;
  taskName: string;
  oldPriority: string;
  newPriority: string;
  projectName?: string;
  taskUrl: string;
}

export function taskPriorityChangedTemplate({
  updaterName,
  taskName,
  oldPriority,
  newPriority,
  projectName,
  taskUrl,
}: TaskPriorityChangedTemplateProps): string {
  const isIncreased = getPriorityLevel(newPriority) > getPriorityLevel(oldPriority);

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
    isIncreased ? "⚠️" : "📉",
    isIncreased ? "Priority Increased" : "Priority Decreased",
    isIncreased ? colors.errorLight : colors.primaryBlueLight,
    isIncreased ? colors.errorDark : colors.primaryBlueDark
  )}

    <h2 style="margin: 0 0 20px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      Task priority has been ${isIncreased ? 'increased' : 'decreased'}
    </h2>

    <p style="margin: 0 0 24px 0; color: ${colors.bodyText}; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      <strong style="color: ${colors.darkText};">${updaterName}</strong> has changed the priority of:
    </p>

    ${createContentCard(taskCardContent, getPriorityColor(newPriority))}

    <div style="background-color: ${colors.cardBackground}; border: 2px solid ${colors.borderColor}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
        <tr>
          <td style="width: 45%; text-align: center; padding: 16px;">
            <div style="margin-bottom: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.medium}; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${typography.fontStack};">
              Previous Priority
            </div>
            ${createBadge(oldPriority, getPriorityColor(oldPriority))}
          </td>
          <td style="width: 10%; text-align: center;">
            <div style="font-size: 24px; color: ${isIncreased ? colors.error : colors.success};">
              ${isIncreased ? '↑' : '↓'}
            </div>
          </td>
          <td style="width: 45%; text-align: center; padding: 16px;">
            <div style="margin-bottom: 8px; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.medium}; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${typography.fontStack};">
              New Priority
            </div>
            ${createBadge(newPriority, getPriorityColor(newPriority))}
          </td>
        </tr>
      </table>
    </div>

    ${isIncreased && newPriority === 'URGENT' ? createAlertBox(
    "🚨",
    "Urgent Attention Required",
    "This task requires immediate attention and action.",
    colors.errorLight,
    colors.error,
    colors.errorDark
  ) : ''}

    ${createButton("View Task Details", taskUrl, getPriorityColor(newPriority))}

    <p style="margin: 20px 0 0 0; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.normal}; font-family: ${typography.fontStack};">
      ${isIncreased ? 'Please review this task and adjust your schedule accordingly.' : 'You can review this task at your convenience.'}
    </p>
  `;

  return baseEmailTemplate(content, "Task Priority Changed");
}

function getPriorityLevel(priority: string): number {
  const levels: Record<string, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 4,
  };
  return levels[priority] || 0;
}

