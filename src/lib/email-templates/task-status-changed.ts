import { baseEmailTemplate, createButton, createBadge, getStatusColor, formatStatus } from "./base";

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
  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 20px;">
        <span style="color: #92400e; font-size: 14px; font-weight: 600;">🔄 Status Update</span>
      </div>
    </div>

    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Task status has been updated
    </h2>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      <strong style="color: #111827;">${updaterName}</strong> has updated the status of:
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px; font-weight: 600;">
        ${taskName}
      </h3>
      ${projectName ? `
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Project: <strong>${projectName}</strong>
        </p>
      ` : ''}
    </div>

    <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="width: 45%; text-align: center; padding: 16px;">
            <div style="margin-bottom: 8px; color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
              Previous Status
            </div>
            ${createBadge(formatStatus(oldStatus), getStatusColor(oldStatus))}
          </td>
          <td style="width: 10%; text-align: center;">
            <div style="font-size: 24px; color: #667eea;">
              →
            </div>
          </td>
          <td style="width: 45%; text-align: center; padding: 16px;">
            <div style="margin-bottom: 8px; color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
              New Status
            </div>
            ${createBadge(formatStatus(newStatus), getStatusColor(newStatus))}
          </td>
        </tr>
      </table>
    </div>

    ${createButton("View Task Details", taskUrl)}

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
      Stay updated on task progress and collaborate with your team.
    </p>
  `;

  return baseEmailTemplate(content);
}
