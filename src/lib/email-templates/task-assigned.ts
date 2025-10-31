import { baseEmailTemplate, createButton, createBadge } from "./base";

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
  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 20px;">
        <span style="color: #1e40af; font-size: 14px; font-weight: 600;">📋 New Task Assignment</span>
      </div>
    </div>

    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      You've been assigned to a new task
    </h2>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      <strong style="color: #111827;">${assignerName}</strong> has assigned you to the following task:
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px; font-weight: 600;">
        ${taskName}
      </h3>
      ${taskDescription ? `
        <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
          ${taskDescription}
        </p>
      ` : ''}
    </div>

    ${projectName || dueDate || priority ? `
      <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;">
        ${projectName ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Project:</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <span style="color: #111827; font-size: 14px; font-weight: 600;">${projectName}</span>
            </td>
          </tr>
        ` : ''}
        ${dueDate ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Due Date:</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <span style="color: #111827; font-size: 14px; font-weight: 600;">📅 ${new Date(dueDate).toLocaleDateString('en-US', { 
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
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Priority:</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              ${createBadge(priority, getPriorityColor(priority))}
            </td>
          </tr>
        ` : ''}
      </table>
    ` : ''}

    ${createButton("View Task Details", taskUrl)}

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
      Click the button above to view the complete task details and get started.
    </p>
  `;

  return baseEmailTemplate(content);
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "#10b981",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    URGENT: "#ef4444",
  };
  return colors[priority] || "#6b7280";
}
