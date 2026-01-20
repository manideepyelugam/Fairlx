import { baseEmailTemplate, createButton } from "./base";
import { colors, typography, createNotificationBadge, createContentCard } from "./theme";

interface TaskUpdatedTemplateProps {
  updaterName: string;
  taskName: string;
  projectName?: string;
  changesDescription?: string;
  taskUrl: string;
}

export function taskUpdatedTemplate({
  updaterName,
  taskName,
  projectName,
  changesDescription,
  taskUrl,
}: TaskUpdatedTemplateProps): string {
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
    ${createNotificationBadge("🔔", "Task Updated", colors.infoLight, colors.infoDark)}

    <h2 style="margin: 0 0 20px 0; color: ${colors.darkText}; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      A task has been updated
    </h2>

    <p style="margin: 0 0 24px 0; color: ${colors.bodyText}; font-size: ${typography.sizes.body}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      <strong style="color: ${colors.darkText};">${updaterName}</strong> has made changes to:
    </p>

    ${createContentCard(taskCardContent, colors.primaryBlue)}

    ${changesDescription ? `
      <div style="background-color: ${colors.warningLight}; border: 1px solid ${colors.warning}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="color: ${colors.warningDark}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.medium}; margin-bottom: 8px; font-family: ${typography.fontStack};">
          📝 Changes Made
        </div>
        <div style="color: #78350f; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
          ${changesDescription}
        </div>
      </div>
    ` : ''}

    ${createButton("View Task Details", taskUrl)}

    <p style="margin: 20px 0 0 0; color: ${colors.mutedText}; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.normal}; font-family: ${typography.fontStack};">
      Click the button above to see all the details and updates.
    </p>
  `;

  return baseEmailTemplate(content, "Task Updated");
}

