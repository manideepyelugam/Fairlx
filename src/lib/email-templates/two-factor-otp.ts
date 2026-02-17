/**
 * 2FA OTP Email Template
 * 
 * Branded email for Two-Factor Authentication codes.
 */

import {
    colors,
    typography,
    createEmailWrapper,
    createNotificationBadge,
    createAlertBox,
} from "./theme";

interface TwoFactorOtpTemplateProps {
    otp: string;
}

export function twoFactorOtpTemplate({
    otp,
}: TwoFactorOtpTemplateProps): string {
    let content = "";

    // Badge
    content += createNotificationBadge(
        "🔒",
        "Two-Factor Authentication",
        colors.infoLight,
        colors.infoDark
    );

    // Heading
    content += `
    <h1 style="margin: 0 0 16px 0; font-size: ${typography.sizes.h1}; font-weight: ${typography.weights.bold}; color: ${colors.darkText}; line-height: ${typography.lineHeight.tight}; font-family: ${typography.fontStack};">
      Your Verification Code
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: ${typography.sizes.body}; color: ${colors.bodyText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
      Use the code below to sign in to your Fairlx account. This code will expire in 5 minutes.
    </p>
  `;

    // OTP Display Box
    content += `
    <div style="background-color: ${colors.backgroundLight}; border-radius: 12px; padding: 32px 24px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 36px; font-weight: ${typography.weights.bold}; color: ${colors.primaryBlue}; letter-spacing: 8px; font-family: ${typography.fontStack};">
        ${otp}
      </span>
    </div>
  `;

    // Expiry notice
    content += `
    <p style="margin: 24px 0 24px 0; font-size: ${typography.sizes.small}; color: ${colors.mutedText}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack}; text-align: center;">
      If you did not request this code, please secure your account immediately.
    </p>
  `;

    // Security notice
    content += createAlertBox(
        "🛡️",
        "Security Tip",
        "Never share your verification code with anyone. Our support team will never ask for it.",
        colors.backgroundLight,
        colors.borderColor,
        colors.mutedText
    );

    return createEmailWrapper(content, `${otp} is your Fairlx verification code`);
}
