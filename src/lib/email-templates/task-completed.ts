import { baseEmailTemplate, createButton } from "./base";

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
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: #d1fae5; border-radius: 8px; margin-bottom: 20px;">
        <span style="color: #065f46; font-size: 14px; font-weight: 600;">✅ Task Completed</span>
      </div>
    </div>

    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Great news! A task has been completed
    </h2>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      <strong style="color: #111827;">${completerName}</strong> has marked this task as complete:
    </p>

    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #10b981; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 32px; margin-right: 12px;">🎉</div>
        <h3 style="margin: 0; color: #065f46; font-size: 20px; font-weight: 700;">
          ${taskName}
        </h3>
      </div>
      ${taskDescription ? `
        <p style="margin: 12px 0 0 0; color: #047857; font-size: 15px; line-height: 1.6;">
          ${taskDescription}
        </p>
      ` : ''}
    </div>

    ${projectName || completedAt ? `
      <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px; background-color: #f9fafb; border-radius: 8px; padding: 16px;">
        ${projectName ? `
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">📁 Project:</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="color: #111827; font-size: 14px; font-weight: 600;">${projectName}</span>
            </td>
          </tr>
        ` : ''}
        ${completedAt ? `
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">✓ Completed:</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="color: #111827; font-size: 14px; font-weight: 600;">${new Date(completedAt).toLocaleString('en-US', { 
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

    ${createButton("View Task", taskUrl, "#10b981")}

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
      Keep up the great work! Your team is making excellent progress.
    </p>
  `;

  return baseEmailTemplate(content);
}
