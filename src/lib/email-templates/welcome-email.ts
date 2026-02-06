/**
 * Welcome Email Template
 * 
 * Sent when a user is invited to join an organization on Fairlx.
 * Uses the centralized theme for consistent branding.
 */

import {
    colors,
    typography,
    createEmailWrapper,
    createPrimaryButton,
    createNotificationBadge,
    createAlertBox,
} from "./theme";
import { getEmailSafeLogoUrl } from "./utils";

interface WelcomeEmailTemplateProps {
    recipientName: string;
    recipientEmail: string;
    organizationName: string;
    tempPassword?: string;
    loginUrl: string;
    firstLoginToken?: string;
    appUrl?: string;
    logoUrl?: string;
}

export function welcomeEmailTemplate({
    recipientName,
    recipientEmail,
    organizationName,
    tempPassword,
    loginUrl,
    firstLoginToken,
    appUrl,
    logoUrl,
}: WelcomeEmailTemplateProps): string {
    const emailSafeLogoUrl = getEmailSafeLogoUrl(logoUrl);

    let content = "";

    // Organization header with logo
    content += `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 56px; height: 56px; margin: 0 auto 16px auto; background-color: ${emailSafeLogoUrl ? 'transparent' : colors.primaryBlue}; border-radius: 12px; text-align: center; vertical-align: middle; overflow: hidden; display: inline-block;">
        ${emailSafeLogoUrl
            ? `<img src="${emailSafeLogoUrl}" alt="${organizationName}" width="56" height="56" style="display: block; width: 56px; height: 56px; border-radius: 12px; object-fit: cover;" />`
            : `<span style="font-size: 24px; line-height: 56px; color: #ffffff; font-weight: 700; font-family: ${typography.fontStack};">${organizationName.charAt(0).toUpperCase()}</span>`
        }
      </div>
      <h2 style="margin: 0 0 4px 0; font-size: ${typography.sizes.h2}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; font-family: ${typography.fontStack};">${organizationName}</h2>
      <p style="margin: 0; font-size: ${typography.sizes.small}; color: ${colors.mutedText}; font-family: ${typography.fontStack};">via Fairlx</p>
    </div>
  `;

    // Badge
    content += createNotificationBadge(
        "🎉",
        "You're Invited",
        colors.successLight,
        colors.successDark
    );

    // Greeting
    content += `
    <h1 style="margin: 0 0 16px 0; font-size: ${typography.sizes.h1}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      Hello, ${recipientName}!
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      You've been invited to join <strong style="color: ${colors.darkText};">${organizationName}</strong> on Fairlx. You now have access to all the collaborative tools and resources available to your team.
    </p>
  `;

    // Magic link section (if token provided)
    if (firstLoginToken && appUrl) {
        content += `
      <div style="padding: 20px; background-color: ${colors.infoLight}; border: 1px solid ${colors.info}; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: ${typography.sizes.body}; font-weight: ${typography.weights.semibold}; color: ${colors.infoDark}; font-family: ${typography.fontStack};">🚀 Quick Login (Recommended)</p>
        <p style="margin: 0 0 16px 0; font-size: ${typography.sizes.small}; color: ${colors.info}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">Click below to log in instantly — no password needed:</p>
        ${createPrimaryButton("Login Directly →", `${appUrl}/auth/first-login?token=${firstLoginToken}`)}
        <p style="margin: 12px 0 0 0; font-size: ${typography.sizes.caption}; color: ${colors.mutedText}; font-family: ${typography.fontStack};">⏱️ This link expires in 24 hours and can only be used once.</p>
      </div>
    `;
    }

    // Credentials section
    content += `
    <div style="padding: 20px; background-color: ${colors.backgroundLight}; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; color: ${colors.darkText}; font-family: ${typography.fontStack};">
        ${firstLoginToken ? "📧 Or Login Manually" : "🔐 Your Login Credentials"}
      </p>
      
      <div style="background-color: ${colors.cardBackground}; border: 1px solid ${colors.borderColor}; border-radius: 6px; overflow: hidden;">
        <div style="padding: 10px 12px; border-bottom: 1px solid ${colors.borderColor};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size: ${typography.sizes.caption}; color: ${colors.mutedText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">Email</td>
              <td style="text-align: right; font-size: ${typography.sizes.small}; color: ${colors.darkText}; font-weight: ${typography.weights.medium}; font-family: ${typography.fontStack};">${recipientEmail}</td>
            </tr>
          </table>
        </div>
        <div style="padding: 10px 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size: ${typography.sizes.caption}; color: ${colors.mutedText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">Password</td>
              <td style="text-align: right;">
                ${tempPassword
            ? `<code style="padding: 4px 10px; background-color: #1e293b; color: #ffffff; border-radius: 4px; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 0.5px;">${tempPassword}</code>`
            : `<span style="font-size: ${typography.sizes.small}; color: ${colors.darkText}; font-family: ${typography.fontStack};">Use your existing password</span>`
        }
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;

    // Login button
    content += createPrimaryButton(
        firstLoginToken ? "Log In Manually →" : "Log In to Fairlx →",
        loginUrl,
        firstLoginToken ? colors.mutedText : undefined
    );

    // Security notice
    content += createAlertBox(
        "🔒",
        "Security",
        "You'll be asked to create a new password on your first login.",
        colors.warningLight,
        colors.warning,
        colors.warningDark
    );

    return createEmailWrapper(content, `Welcome to ${organizationName}!`);
}
