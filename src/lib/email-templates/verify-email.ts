/**
 * Verify Email Template
 * 
 * Branded verification email for new account registration.
 * Uses the centralized theme for consistent Fairlx branding.
 */

import {
  colors,
  typography,
  createEmailWrapper,
  createPrimaryButton,
  createNotificationBadge,
  createAlertBox,
} from "./theme";

interface VerifyEmailTemplateProps {
  userName: string;
  verifyUrl: string;
}

export function verifyEmailTemplate({
  userName,
  verifyUrl,
}: VerifyEmailTemplateProps): string {
  let content = "";

  // Badge
  content += createNotificationBadge(
    "✉️",
    "Email Verification",
    colors.infoLight,
    colors.infoDark
  );

  // Greeting
  content += `
    <h1 style="margin: 0 0 16px 0; font-size: ${typography.sizes.h1}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      Verify Your Email
    </h1>
    
    <p style="margin: 0 0 8px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      Hello <strong style="color: ${colors.darkText};">${userName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      Thanks for signing up for Fairlx! Please confirm your email address by clicking the button below.
    </p>
  `;

  // CTA Button
  content += createPrimaryButton("Verify Email Address →", verifyUrl);

  // Expiry notice
  content += `
    <p style="margin: 24px 0 0 0; font-size: ${typography.sizes.small}; color: ${colors.mutedText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack}; text-align: center;">
      This link expires in 24 hours.
    </p>
  `;

  // Security notice
  content += createAlertBox(
    "🔒",
    "Security Notice",
    "If you didn't create an account with Fairlx, you can safely ignore this email.",
    colors.backgroundLight,
    colors.borderColor,
    colors.mutedText
  );

  return createEmailWrapper(content, "Verify Your Email - Fairlx");
}
