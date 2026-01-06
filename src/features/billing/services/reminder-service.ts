import "server-only";

import { ID, Query } from "node-appwrite";

import {
    DATABASE_ID,
    BILLING_ACCOUNTS_ID,
    BILLING_AUDIT_LOGS_ID,
} from "@/config";
import { createAdminClient } from "@/lib/appwrite";

import {
    BillingStatus,
    BillingAccountType,
    BillingAccount,
    BillingAuditEventType,
    REMINDER_SCHEDULE_DAYS,
} from "../types";

/**
 * Grace Period Reminder Service
 * 
 * Sends reminder emails to accounts in DUE status:
 * - Day 1: Initial payment failure notification
 * - Day 7: 1-week reminder
 * - Day 13: Final warning (1 day before suspension)
 * 
 * CRITICAL: This relies on an email service (e.g., Resend, SendGrid, SES)
 * Configure EMAIL_FROM and EMAIL_API_KEY in environment
 */

interface ReminderResult {
    accountId: string;
    email: string;
    reminderDay: number;
    success: boolean;
    error?: string;
}

/**
 * Calculate days since grace period started
 */
function getDaysSinceGracePeriodStart(account: BillingAccount): number {
    if (!account.gracePeriodEnd) return 0;

    // Grace period is 14 days, so start = end - 14 days
    const gracePeriodEnd = new Date(account.gracePeriodEnd);
    const gracePeriodStart = new Date(gracePeriodEnd);
    gracePeriodStart.setDate(gracePeriodStart.getDate() - 14);

    const now = new Date();
    const diffMs = now.getTime() - gracePeriodStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Check if a reminder should be sent today for this account
 */
function shouldSendReminder(account: BillingAccount): number | null {
    const daysSinceStart = getDaysSinceGracePeriodStart(account);

    // Check if today matches any reminder schedule day
    if (REMINDER_SCHEDULE_DAYS.includes(daysSinceStart)) {
        return daysSinceStart;
    }

    return null;
}

/**
 * Get email template for reminder
 */
function getReminderEmailContent(
    reminderDay: number,
    accountType: BillingAccountType,
    daysRemaining: number
): { subject: string; html: string; text: string } {
    const accountName = accountType === BillingAccountType.ORG ? "organization" : "account";

    if (reminderDay === 1) {
        return {
            subject: "Action Required: Payment Failed for Your Fairlx Account",
            html: `
                <h2>Payment Failed</h2>
                <p>We were unable to process your recent payment. Your ${accountName} remains fully accessible during the 14-day grace period.</p>
                <p><strong>Days remaining:</strong> ${daysRemaining}</p>
                <p>Please update your payment method to avoid service interruption:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Update Payment Method</a>
                <p style="margin-top: 20px; color: #666;">If you have any questions, please contact our support team.</p>
            `,
            text: `Payment Failed\n\nWe were unable to process your recent payment. Your ${accountName} remains fully accessible during the 14-day grace period.\n\nDays remaining: ${daysRemaining}\n\nPlease update your payment method at: ${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        };
    } else if (reminderDay === 7) {
        return {
            subject: "Reminder: Update Your Payment Method - 7 Days Remaining",
            html: `
                <h2>Payment Reminder</h2>
                <p>This is a friendly reminder that your payment is still pending. Your ${accountName} will be suspended in <strong>${daysRemaining} days</strong> if payment is not received.</p>
                <p>Update your payment method now to maintain uninterrupted access:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Update Payment Method</a>
                <p style="margin-top: 20px; color: #666;">Your data is safe and will not be deleted even if your account is suspended.</p>
            `,
            text: `Payment Reminder\n\nThis is a friendly reminder that your payment is still pending. Your ${accountName} will be suspended in ${daysRemaining} days if payment is not received.\n\nUpdate your payment method at: ${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        };
    } else {
        // Day 13 - Final warning
        return {
            subject: "URGENT: Your Account Will Be Suspended Tomorrow",
            html: `
                <h2 style="color: #dc2626;">Final Warning</h2>
                <p>Your ${accountName} will be <strong>suspended tomorrow</strong> due to unpaid invoice.</p>
                <p>Once suspended, you will not be able to access your workspaces, projects, or data until payment is received.</p>
                <p><strong>Take action now to avoid interruption:</strong></p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px;">Pay Now</a>
                <p style="margin-top: 20px; color: #666;">Don't worry - your data is safe. You can restore access anytime by completing your payment.</p>
            `,
            text: `FINAL WARNING\n\nYour ${accountName} will be suspended tomorrow due to unpaid invoice.\n\nOnce suspended, you will not be able to access your workspaces, projects, or data until payment is received.\n\nPay now at: ${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        };
    }
}

/**
 * Send email via configured email service
 * 
 * TODO: Implement with your email provider (Resend, SendGrid, SES, etc.)
 */
async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<{ success: boolean; error?: string }> {
    // Check if email service is configured
    const emailApiKey = process.env.EMAIL_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || "billing@fairlx.com";

    if (!emailApiKey) {
        console.warn("[Email] EMAIL_API_KEY not configured - email not sent");
        return { success: false, error: "Email service not configured" };
    }

    try {
        // Example implementation with Resend
        // Replace with your preferred email provider

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${emailApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: emailFrom,
                to: [to],
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[Email] Failed to send:", error);
            return { success: false, error };
        }

        console.log(`[Email] Sent to ${to}: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error("[Email] Error sending:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Send grace period reminders to all eligible accounts
 * 
 * Called by /api/cron/billing/send-reminders
 */
export async function sendGracePeriodReminders(): Promise<{
    processed: number;
    sent: number;
    results: ReminderResult[];
}> {
    const { databases } = await createAdminClient();

    // Find accounts in DUE status with grace period set
    const accounts = await databases.listDocuments<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        [
            Query.equal("billingStatus", BillingStatus.DUE),
            Query.isNotNull("gracePeriodEnd"),
            Query.limit(100),
        ]
    );

    const results: ReminderResult[] = [];

    for (const account of accounts.documents) {
        const reminderDay = shouldSendReminder(account);

        if (reminderDay === null) {
            // Not a reminder day for this account
            continue;
        }

        // Get email address
        const email = account.billingEmail;
        if (!email) {
            console.warn(`[Reminders] No email for account ${account.$id}`);
            continue;
        }

        // Calculate days remaining
        const gracePeriodEnd = new Date(account.gracePeriodEnd!);
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        // Get email content
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { subject, html, text } = getReminderEmailContent(
            reminderDay,
            account.type,
            daysRemaining
        );

        // Send email
        const emailResult = await sendEmail(email, subject, html);

        results.push({
            accountId: account.$id,
            email,
            reminderDay,
            success: emailResult.success,
            error: emailResult.error,
        });

        // Log audit event
        if (emailResult.success) {
            await databases.createDocument(
                DATABASE_ID,
                BILLING_AUDIT_LOGS_ID,
                ID.unique(),
                {
                    billingAccountId: account.$id,
                    eventType: BillingAuditEventType.GRACE_PERIOD_REMINDER_SENT,
                    metadata: JSON.stringify({
                        reminderDay,
                        daysRemaining,
                        email,
                    }),
                }
            );
        }
    }

    const sent = results.filter(r => r.success).length;
    console.log(`[Reminders] Processed ${accounts.total} accounts, sent ${sent} reminders`);

    return {
        processed: accounts.total,
        sent,
        results,
    };
}
