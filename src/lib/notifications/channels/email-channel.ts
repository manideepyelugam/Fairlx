/**
 * Email Channel Handler
 * 
 * Handles SMTP email notifications using Appwrite Messaging.
 * Uses the existing Fairlx email theme for consistent branding.
 */

import { ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, PROJECTS_ID } from "@/config";
import { NotificationPayload, ChannelHandler, NotificationChannel, WorkitemEventType } from "../types";
import {
    colors,
    typography,
    createEmailWrapper,
    createPrimaryButton,
    createNotificationBadge,
    createContentCard,
    createAlertBox,
    getPriorityColor,
} from "@/lib/email-templates/theme";

export class EmailChannelHandler implements ChannelHandler {
    readonly name: NotificationChannel = "email";

    /**
     * Send notification email to user
     */
    async send(userId: string, payload: NotificationPayload): Promise<void> {
        try {
            const { messaging, users, databases } = await createAdminClient();

            // Get user details
            const user = await users.get(userId);

            if (!user.email) {
                return;
            }

            // Get project name if available
            let projectName: string | undefined;
            if (payload.metadata?.projectId) {
                try {
                    const project = await databases.getDocument(
                        DATABASE_ID,
                        PROJECTS_ID,
                        payload.metadata.projectId as string
                    );
                    projectName = project.name as string;
                } catch {
                    // Project not found, continue without it
                }
            }

            // Build email content
            const subject = this.buildSubject(payload);
            const body = this.buildEmailBody(payload, projectName);

            // Send via Appwrite Messaging
            await messaging.createEmail(
                ID.unique(),
                subject,
                body,
                [], // Topics
                [userId], // Users to send to
                [], // Targets
                [], // CC
                [], // BCC
                [], // Attachments
                false, // Draft (false = send immediately)
                true // HTML content
            );

            // console.log(`[EmailChannel] Email sent to user: ${userId} (${user.email})`);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Build email subject line
     */
    private buildSubject(payload: NotificationPayload): string {
        switch (payload.type) {
            case WorkitemEventType.WORKITEM_ASSIGNED:
                return `✅ You've been assigned: ${payload.title}`;
            case WorkitemEventType.WORKITEM_COMPLETED:
                return `🎉 Task completed: ${payload.title}`;
            case WorkitemEventType.WORKITEM_OVERDUE:
                return `⚠️ Overdue: ${payload.title}`;
            case WorkitemEventType.WORKITEM_DUE_DATE_APPROACHING:
                return `⏰ Due soon: ${payload.title}`;
            case WorkitemEventType.WORKITEM_PRIORITY_CHANGED:
                if (payload.metadata?.newPriority === "URGENT") {
                    return `🔴 Urgent: ${payload.title}`;
                }
                return `Priority changed: ${payload.title}`;
            case WorkitemEventType.WORKITEM_COMMENT_ADDED:
                if (payload.metadata?.isMentioned) {
                    return `💬 You were mentioned in: ${payload.title}`;
                }
                return `💬 New comment on: ${payload.title}`;
            default:
                return `Fairlx: ${payload.title}`;
        }
    }

    /**
     * Build email body HTML using centralized theme
     */
    private buildEmailBody(payload: NotificationPayload, projectName?: string): string {
        const { type, title, summary, triggeredByName, deepLinkUrl, metadata } = payload;

        // Get badge config based on event type
        const badgeConfig = this.getBadgeConfig(type);

        // Build the content
        let content = "";

        // Notification type badge
        content += createNotificationBadge(
            badgeConfig.emoji,
            badgeConfig.label,
            badgeConfig.bgColor,
            badgeConfig.textColor
        );

        // Main heading
        content += `
      <h1 style="margin: 0 0 12px 0; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
        ${title}
      </h1>
    `;

        // Summary
        content += `
      <p style="margin: 0 0 24px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
        ${summary}
      </p>
    `;

        // Project context if available
        if (projectName) {
            content += createContentCard(
                `<p style="margin: 0; font-size: ${typography.sizes.small}; color: ${colors.mutedText}; font-family: ${typography.fontStack};">
          Project: <strong style="color: ${colors.darkText};">${projectName}</strong>
        </p>`,
                colors.primaryBlue
            );
        }

        // Status/priority change details
        if (metadata?.oldStatus && metadata?.newStatus) {
            content += this.buildStatusChangeSection(
                metadata.oldStatus as string,
                metadata.newStatus as string
            );
        }

        if (metadata?.oldPriority && metadata?.newPriority) {
            content += this.buildPriorityChangeSection(
                metadata.oldPriority as string,
                metadata.newPriority as string
            );
        }

        // Alert for urgent/overdue
        if (type === WorkitemEventType.WORKITEM_OVERDUE) {
            content += createAlertBox(
                "⚠️",
                "Action Required",
                "This task is past its due date. Please review and update accordingly.",
                colors.errorLight,
                colors.error,
                colors.errorDark
            );
        }

        if (type === WorkitemEventType.WORKITEM_DUE_DATE_APPROACHING) {
            content += createAlertBox(
                "⏰",
                "Due Soon",
                "This task is approaching its due date. Make sure to complete it on time.",
                colors.warningLight,
                colors.warning,
                colors.warningDark
            );
        }

        // CTA Button
        content += createPrimaryButton("View Task →", deepLinkUrl);

        // Triggered by
        content += `
      <p style="margin: 24px 0 0 0; font-size: ${typography.sizes.caption}; color: ${colors.mutedText}; font-family: ${typography.fontStack};">
        Triggered by: ${triggeredByName}
      </p>
    `;

        // Wrap with email template
        return createEmailWrapper(content, summary);
    }

    /**
     * Get badge configuration based on event type
     */
    private getBadgeConfig(type: WorkitemEventType): {
        emoji: string;
        label: string;
        bgColor: string;
        textColor: string;
    } {
        switch (type) {
            case WorkitemEventType.WORKITEM_ASSIGNED:
                return {
                    emoji: "✅",
                    label: "Assigned to You",
                    bgColor: colors.successLight,
                    textColor: colors.successDark,
                };
            case WorkitemEventType.WORKITEM_COMPLETED:
                return {
                    emoji: "🎉",
                    label: "Task Completed",
                    bgColor: colors.successLight,
                    textColor: colors.successDark,
                };
            case WorkitemEventType.WORKITEM_OVERDUE:
                return {
                    emoji: "⚠️",
                    label: "Overdue",
                    bgColor: colors.errorLight,
                    textColor: colors.errorDark,
                };
            case WorkitemEventType.WORKITEM_DUE_DATE_APPROACHING:
                return {
                    emoji: "⏰",
                    label: "Due Soon",
                    bgColor: colors.warningLight,
                    textColor: colors.warningDark,
                };
            case WorkitemEventType.WORKITEM_PRIORITY_CHANGED:
                return {
                    emoji: "🔔",
                    label: "Priority Changed",
                    bgColor: colors.infoLight,
                    textColor: colors.infoDark,
                };
            case WorkitemEventType.WORKITEM_COMMENT_ADDED:
                return {
                    emoji: "💬",
                    label: "New Comment",
                    bgColor: colors.infoLight,
                    textColor: colors.infoDark,
                };
            default:
                return {
                    emoji: "📋",
                    label: "Task Update",
                    bgColor: colors.infoLight,
                    textColor: colors.infoDark,
                };
        }
    }

    /**
     * Build status change section
     */
    private buildStatusChangeSection(oldStatus: string, newStatus: string): string {
        return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px; background-color: ${colors.backgroundLight}; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: ${typography.sizes.caption}; color: ${colors.mutedText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">
              Status Change
            </p>
            <p style="margin: 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; font-family: ${typography.fontStack};">
              <span style="text-decoration: line-through; color: ${colors.mutedText};">${oldStatus.replace(/_/g, " ")}</span>
              <span style="padding: 0 8px;">→</span>
              <strong style="color: ${colors.primaryBlue};">${newStatus.replace(/_/g, " ")}</strong>
            </p>
          </td>
        </tr>
      </table>
    `;
    }

    /**
     * Build priority change section
     */
    private buildPriorityChangeSection(oldPriority: string, newPriority: string): string {
        const newPriorityColor = getPriorityColor(newPriority);

        return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px; background-color: ${colors.backgroundLight}; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: ${typography.sizes.caption}; color: ${colors.mutedText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">
              Priority Change
            </p>
            <p style="margin: 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; font-family: ${typography.fontStack};">
              <span style="text-decoration: line-through; color: ${colors.mutedText};">${oldPriority}</span>
              <span style="padding: 0 8px;">→</span>
              <strong style="color: ${newPriorityColor};">${newPriority}</strong>
            </p>
          </td>
        </tr>
      </table>
    `;
    }
}

// Export singleton instance
export const emailChannelHandler = new EmailChannelHandler();
