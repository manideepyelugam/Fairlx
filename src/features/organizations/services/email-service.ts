import { createAdminClient } from "@/lib/appwrite";

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
    tempPassword: string;
    loginUrl: string;
    /** Optional first-login magic link token (raw, not hashed) */
    firstLoginToken?: string;
    /** App base URL for constructing magic link */
    appUrl?: string;
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
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
        const { messaging } = await createAdminClient();
        const { ID } = await import("node-appwrite");

        const subject = `Welcome to ${organizationName}!`;

        // Build magic link section if token provided
        const magicLinkSection = firstLoginToken && appUrl ? `
    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0070f3;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #0070f3;">🚀 Quick Login (Recommended)</p>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #333;">Click below to log in instantly — no password needed:</p>
        <a href="${appUrl}/auth/first-login?token=${firstLoginToken}" 
           style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Login Directly
        </a>
        <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
            ⚠️ This link expires in <strong>24 hours</strong> and can only be used <strong>once</strong>.
        </p>
    </div>
        ` : "";

        const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome to ${organizationName}!</h2>
    <p>Hello ${recipientName},</p>
    <p>You've been added to <strong>${organizationName}</strong> as an organization member.</p>
    
    ${magicLinkSection}

    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">${firstLoginToken ? "📧 Alternative: Manual Login" : "Your temporary login credentials:"}</p>
        <p style="margin: 5px 0;">Email: ${recipientEmail}</p>
        <p style="margin: 5px 0;">Temporary Password: <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
    </div>

    <p><a href="${loginUrl}" style="background-color: ${firstLoginToken ? "#6c757d" : "#0070f3"}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In Manually</a></p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
        For security, you will be required to change your password immediately upon your first login.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
    <p style="font-size: 12px; color: #999;">
        Sent by ${organizationName} • <a href="${loginUrl}">${loginUrl}</a>
    </p>
</div>
        `.trim();

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

        console.log(`[Email Service] Welcome email sent to ${recipientEmail} (${recipientUserId})`);

        return { success: true };

    } catch (error) {
        console.error("[Email Service] Failed to send welcome email:", error);

        // Log the content for debugging if sending fails (e.g. no provider)
        console.log("[Email Service] FALLBACK - Welcome email content:", {
            to: recipientEmail,
            passwordIncluded: !!tempPassword,
            hasMagicLink: !!firstLoginToken,
        });

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
    } catch (error) {
        // Non-blocking - just log if audit fails
        console.error("[Email Service] Failed to log email event:", error);
    }
}
