import { baseEmailTemplate, createButton, createBadge, getPriorityColor } from "./base";

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
  
  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: ${isIncreased ? '#fee2e2' : '#dbeafe'}; border-radius: 8px; margin-bottom: 20px;">
        <span style="color: ${isIncreased ? '#991b1b' : '#1e40af'}; font-size: 14px; font-weight: 600;">
          ${isIncreased ? '⚠️ Priority Increased' : '📉 Priority Decreased'}
        </span>
      </div>
    </div>

    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Task priority has been ${isIncreased ? 'increased' : 'decreased'}
    </h2>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      <strong style="color: #111827;">${updaterName}</strong> has changed the priority of:
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid ${getPriorityColor(newPriority)}; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
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
              Previous Priority
            </div>
            ${createBadge(oldPriority, getPriorityColor(oldPriority))}
          </td>
          <td style="width: 10%; text-align: center;">
            <div style="font-size: 24px; color: ${isIncreased ? '#ef4444' : '#10b981'};">
              ${isIncreased ? '↑' : '↓'}
            </div>
          </td>
          <td style="width: 45%; text-align: center; padding: 16px;">
            <div style="margin-bottom: 8px; color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
              New Priority
            </div>
            ${createBadge(newPriority, getPriorityColor(newPriority))}
          </td>
        </tr>
      </table>
    </div>

    ${isIncreased && newPriority === 'URGENT' ? `
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center;">
          <div style="font-size: 24px; margin-right: 12px;">🚨</div>
          <div>
            <div style="color: #991b1b; font-size: 15px; font-weight: 600; margin-bottom: 4px;">
              Urgent Attention Required
            </div>
            <div style="color: #7f1d1d; font-size: 14px;">
              This task requires immediate attention and action.
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    ${createButton("View Task Details", taskUrl, getPriorityColor(newPriority))}

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
      ${isIncreased ? 'Please review this task and adjust your schedule accordingly.' : 'You can review this task at your convenience.'}
    </p>
  `;

  return baseEmailTemplate(content);
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
