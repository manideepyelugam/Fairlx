import { baseEmailTemplate, createButton } from "./base";

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
  
  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: ${isDueSoon ? '#fee2e2' : '#dbeafe'}; border-radius: 8px; margin-bottom: 20px;">
        <span style="color: ${isDueSoon ? '#991b1b' : '#1e40af'}; font-size: 14px; font-weight: 600;">
          📅 Due Date ${oldDueDate ? 'Updated' : 'Set'}
        </span>
      </div>
    </div>

    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Task due date has been ${oldDueDate ? 'changed' : 'set'}
    </h2>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      <strong style="color: #111827;">${updaterName}</strong> has ${oldDueDate ? 'updated' : 'set'} the due date for:
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

    <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      ${oldDueDate ? `
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="width: 45%; text-align: center; padding: 16px;">
              <div style="margin-bottom: 8px; color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                Previous Due Date
              </div>
              <div style="color: #111827; font-size: 16px; font-weight: 600;">
                📅 ${new Date(oldDueDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </td>
            <td style="width: 10%; text-align: center;">
              <div style="font-size: 24px; color: ${isExtended ? '#10b981' : '#ef4444'};">
                →
              </div>
            </td>
            <td style="width: 45%; text-align: center; padding: 16px;">
              <div style="margin-bottom: 8px; color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                New Due Date
              </div>
              <div style="color: #111827; font-size: 16px; font-weight: 600;">
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
          <div style="margin-bottom: 8px; color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
            Due Date
          </div>
          <div style="color: #111827; font-size: 18px; font-weight: 600;">
            📅 ${new Date(newDueDate).toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          ${!isOverdue ? `
            <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
              ${daysUntilDue === 0 ? 'Due today' : daysUntilDue === 1 ? 'Due tomorrow' : `Due in ${daysUntilDue} days`}
            </div>
          ` : ''}
        </div>
      `}
    </div>

    ${isDueSoon && !isOverdue ? `
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center;">
          <div style="font-size: 24px; margin-right: 12px;">⏰</div>
          <div>
            <div style="color: #991b1b; font-size: 15px; font-weight: 600; margin-bottom: 4px;">
              Due Soon!
            </div>
            <div style="color: #7f1d1d; font-size: 14px;">
              This task is due ${daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}. 
              ${oldDueDate && isExtended ? 'The deadline has been extended.' : 'Make sure to complete it on time.'}
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    ${isOverdue ? `
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center;">
          <div style="font-size: 24px; margin-right: 12px;">⚠️</div>
          <div>
            <div style="color: #991b1b; font-size: 15px; font-weight: 600; margin-bottom: 4px;">
              Overdue Task
            </div>
            <div style="color: #7f1d1d; font-size: 14px;">
              This task was due ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'day' : 'days'} ago. 
              Please prioritize completing it.
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    ${createButton("View Task Details", taskUrl, isDueSoon || isOverdue ? '#ef4444' : '#667eea')}

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
      ${isDueSoon || isOverdue ? 'Please review and update your schedule accordingly.' : 'Plan your work to meet this deadline.'}
    </p>
  `;

  return baseEmailTemplate(content);
}
