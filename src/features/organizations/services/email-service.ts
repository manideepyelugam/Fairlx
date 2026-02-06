import { createAdminClient } from "@/lib/appwrite";
import { welcomeEmailTemplate } from "@/lib/email-templates";

/**
 * Email Service for Organization Member Notifications
 * 
 * Uses Appwrite's built-in email functionality via the Account API.
 * For production, configure SMTP in Appwrite Console > Messaging.
 */

interface WelcomeEmailParams {
  recipientEmail: string;
  recipientName: string;
  recipientUserId: string; // Added userId for Appwrite Messaging
  organizationName: string;
  tempPassword?: string;
  loginUrl: string;
  /** Optional first-login magic link token (raw, not hashed) */
  firstLoginToken?: string;
  /** App base URL for constructing magic link */
  appUrl?: string;
  /** Optional logo URL for organization/workspace branding in email */
  logoUrl?: string;
}

/**
 * Send welcome email to new org member with temp password
 * 
 * SECURITY: This uses Appwrite's messaging system.
 * The temp password is included in the email body.
 * If firstLoginToken is provided, includes a magic link option.
 */
export async function sendWelcomeEmail({
  recipientEmail,
  recipientName,
  recipientUserId,
  organizationName,
  tempPassword,
  loginUrl,
  firstLoginToken,
  appUrl,
  logoUrl,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { messaging } = await createAdminClient();
    const { ID } = await import("node-appwrite");

    const subject = `Welcome to ${organizationName}!`;

    // Generate HTML using the centralized template
    const body = welcomeEmailTemplate({
      recipientName,
      recipientEmail,
      organizationName,
      tempPassword,
      loginUrl,
      firstLoginToken,
      appUrl,
      logoUrl,
    });

    // Send via Appwrite Messaging
    // This requires an Email Provider (SMTP/Mailgun/SendGrid) configured in Appwrite Console
    await messaging.createEmail(
      ID.unique(),    // messageId
      subject,        // subject
      body,           // content
      [],             // topics
      [recipientUserId], // users (send to specific user ID)
      [],             // targets
      [],             // cc
      [],             // bcc
      [],             // attachments
      false,          // draft (false = send immediately)
      true            // html
    );

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Log email sent event to audit (non-blocking)
 */
export async function logEmailSent({
  organizationId,
  recipientUserId,
  recipientEmail,
  emailType,
}: {
  organizationId: string;
  recipientUserId: string;
  recipientEmail: string;
  emailType: "welcome" | "password_reset" | "notification";
}): Promise<void> {
  try {
    const { logOrgAudit, OrgAuditAction } = await import("@/features/organizations/audit");
    const { databases } = await createAdminClient();

    await logOrgAudit({
      databases,
      organizationId,
      actorUserId: "system",
      actionType: OrgAuditAction.MEMBER_ADDED, // Could add EMAIL_SENT action
      metadata: {
        eventType: "email_sent",
        emailType,
        recipientUserId,
        recipientEmail,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Non-blocking - audit logging failed silently
  }
}
