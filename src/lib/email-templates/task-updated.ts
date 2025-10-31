import { baseEmailTemplate, createButton } from "./base";

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
  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: #e0e7ff; border-radius: 8px; margin-bottom: 20px;">
        <span style="color: #3730a3; font-size: 14px; font-weight: 600;">🔔 Task Updated</span>
      </div>
    </div>

    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      A task has been updated
    </h2>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      <strong style="color: #111827;">${updaterName}</strong> has made changes to:
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px; font-weight: 600;">
        ${taskName}
      </h3>
      ${projectName ? `
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Project: <strong>${projectName}</strong>
        </p>
      ` : ''}
    </div>

    ${changesDescription ? `
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="color: #92400e; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
          📝 Changes Made:
        </div>
        <div style="color: #78350f; font-size: 14px; line-height: 1.6;">
          ${changesDescription}
        </div>
      </div>
    ` : ''}

    ${createButton("View Task Details", taskUrl)}

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
      Click the button above to see all the details and updates.
    </p>
  `;

  return baseEmailTemplate(content);
}
