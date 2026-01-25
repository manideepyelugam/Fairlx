import { createAdminClient } from "@/lib/appwrite";
import { getEmailSafeLogoUrl } from "@/lib/email-templates/utils";

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

    // Sanitize logo URL - email clients block base64 data URLs
    const emailSafeLogoUrl = getEmailSafeLogoUrl(logoUrl);

    const subject = `Welcome to ${organizationName}!`;

    // Theme colors
    const primaryBlue = "#2563eb";
    const darkText = "#111827";
    const bodyText = "#374151";
    const mutedText = "#6b7280";
    const lightText = "#9ca3af";
    const bgMain = "#f8fafc";
    const bgLight = "#f1f5f9";
    const cardBg = "#ffffff";
    const border = "#e2e8f0";
    const fontStack = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

    // Build magic link section if token provided
    const magicLinkSection = firstLoginToken && appUrl ? `
<!-- Magic Link Section -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
  <tr>
    <td style="padding: 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1e40af; font-family: ${fontStack};">🚀 Quick Login (Recommended)</p>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #3b82f6; line-height: 1.5; font-family: ${fontStack};">Click below to log in instantly — no password needed:</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="border-radius: 6px; background-color: ${primaryBlue};">
                  <a href="${appUrl}/auth/first-login?token=${firstLoginToken}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 14px; font-weight: 600; font-family: ${fontStack}; text-decoration: none; border-radius: 6px;">Login Directly →</a>
                </td>
              </tr>
            </table>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: ${mutedText}; font-family: ${fontStack};">⏱️ This link expires in 24 hours and can only be used once.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
        ` : "";

    // Conditional Password Section
    const passwordRow = tempPassword ? `
                            <tr>
                              <td style="padding: 10px 12px; background-color: ${cardBg}; border: 1px solid ${border}; border-radius: 0 0 6px 6px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                  <tr>
                                    <td style="font-size: 12px; color: ${mutedText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; font-family: ${fontStack};">Password</td>
                                    <td style="text-align: right;">
                                      <code style="padding: 4px 10px; background-color: #1e293b; color: #ffffff; border-radius: 4px; font-size: 13px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 0.5px;">${tempPassword}</code>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
    ` : `
                            <tr>
                              <td style="padding: 10px 12px; background-color: ${cardBg}; border: 1px solid ${border}; border-radius: 0 0 6px 6px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                  <tr>
                                    <td style="font-size: 12px; color: ${mutedText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; font-family: ${fontStack};">Password</td>
                                    <td style="text-align: right; font-size: 13px; color: ${darkText}; font-family: ${fontStack};">
                                      Use your existing password
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
    `;

    const body = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-content { padding: 24px 20px !important; }
      .stack-column { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgMain}; font-family: ${fontStack};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${bgMain};">
    <tr>
      <td style="padding: 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-container" style="margin: 0 auto; max-width: 560px;">
          
          <!-- Logo -->
          <tr>
            <td style="padding: 0 0 24px 0; text-align: center;">
              <span style="font-size: 26px; font-weight: 700; color: ${primaryBlue}; font-family: ${fontStack}; letter-spacing: -0.5px;">fairlx<span style="color: ${primaryBlue};">.</span></span>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${cardBg}; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);">
                
                <!-- Organization Header -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid ${border};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 16px auto;">
                      <tr>
                        <td style="width: 56px; height: 56px; background-color: ${emailSafeLogoUrl ? 'transparent' : primaryBlue}; border-radius: 12px; text-align: center; vertical-align: middle; overflow: hidden;">
                          ${emailSafeLogoUrl
        ? `<img src="${emailSafeLogoUrl}" alt="${organizationName}" width="56" height="56" style="display: block; width: 56px; height: 56px; border-radius: 12px; object-fit: cover;" />`
        : `<span style="font-size: 24px; line-height: 56px; color: #ffffff; font-weight: 700; font-family: ${fontStack};">${organizationName.charAt(0).toUpperCase()}</span>`
      }
                        </td>
                      </tr>
                    </table>
                    <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: ${darkText}; font-family: ${fontStack};">${organizationName}</h2>
                    <p style="margin: 0; font-size: 13px; color: ${mutedText}; font-family: ${fontStack};">via Fairlx</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td class="email-content" style="padding: 32px;">
                    
                    <!-- Badge -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 6px 12px; background-color: #ecfdf5; border-radius: 4px;">
                          <span style="font-size: 13px; font-weight: 600; color: #047857; font-family: ${fontStack};">🎉 You're Invited</span>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Greeting -->
                    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: ${darkText}; line-height: 1.3; font-family: ${fontStack};">Hello, ${recipientName}!</h1>
                    
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: ${bodyText}; line-height: 1.6; font-family: ${fontStack};">
                      You've been invited to join <strong style="color: ${darkText};">${organizationName}</strong> on Fairlx. You now have access to all the collaborative tools and resources available to your team.
                    </p>
                    
                    ${magicLinkSection}
                    
                    <!-- Credentials -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px; background-color: ${bgLight}; border-radius: 8px;">
                          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: ${darkText}; font-family: ${fontStack};">
                            ${firstLoginToken ? "📧 Or Login Manually" : "🔐 Your Login Credentials"}
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 10px 12px; background-color: ${cardBg}; border: 1px solid ${border}; border-bottom: none; border-radius: 6px 6px 0 0;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                  <tr>
                                    <td style="font-size: 12px; color: ${mutedText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; font-family: ${fontStack};">Email</td>
                                    <td style="text-align: right; font-size: 14px; color: ${darkText}; font-weight: 500; font-family: ${fontStack};">${recipientEmail}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ${passwordRow}
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Login Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="border-radius: 8px; background-color: ${firstLoginToken ? "#64748b" : primaryBlue}; text-align: center;">
                                <a href="${loginUrl}" target="_blank" style="display: block; padding: 14px 24px; color: #ffffff; font-size: 15px; font-weight: 600; font-family: ${fontStack}; text-decoration: none; border-radius: 8px;">
                                  ${firstLoginToken ? "Log In Manually" : "Log In to Fairlx"} →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 14px 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
                          <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5; font-family: ${fontStack};">
                            <strong>🔒 Security:</strong> You'll be asked to create a new password on your first login.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 16px 0 16px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: ${mutedText}; font-family: ${fontStack};">
                This invitation was sent from ${organizationName}
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: ${lightText}; font-family: ${fontStack};">
                <a href="mailto:support@fairlx.com" style="color: ${primaryBlue}; text-decoration: none;">Help</a>
                <span style="padding: 0 4px;">·</span>
                <a href="https://fairlx.com/privacy" style="color: ${primaryBlue}; text-decoration: none;">Privacy</a>
                <span style="padding: 0 4px;">·</span>
                <a href="https://fairlx.com/terms" style="color: ${primaryBlue}; text-decoration: none;">Terms</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: ${lightText}; font-family: ${fontStack};">© 2025 Stemlen. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
