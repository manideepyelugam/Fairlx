/**
 * Fairlx Email Theme
 * 
 * Centralized design tokens and responsive email template components.
 * This ensures consistency across all transactional emails.
 */

// =============================================================================
// BRAND COLORS
// =============================================================================

export const colors = {
  // Primary brand
  primaryBlue: "#2563eb",
  primaryBlueHover: "#1d4ed8",
  primaryBlueDark: "#1e40af",
  primaryBlueLight: "#eff6ff",

  // Neutral grays
  darkText: "#111827",
  bodyText: "#374151",
  mutedText: "#6b7280",
  lightText: "#9ca3af",

  // Backgrounds
  backgroundMain: "#f8fafc",
  backgroundLight: "#f1f5f9",
  cardBackground: "#ffffff",

  // Borders
  borderColor: "#e2e8f0",
  borderLight: "#f1f5f9",

  // Status colors
  success: "#059669",
  successLight: "#ecfdf5",
  successDark: "#047857",

  warning: "#d97706",
  warningLight: "#fffbeb",
  warningDark: "#92400e",

  error: "#dc2626",
  errorLight: "#fef2f2",
  errorDark: "#991b1b",

  info: "#2563eb",
  infoLight: "#eff6ff",
  infoDark: "#1e40af",
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontStack: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",

  sizes: {
    h1: "26px",
    h2: "22px",
    h3: "18px",
    body: "15px",
    small: "14px",
    caption: "12px",
  },

  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.625",
  },
};

// =============================================================================
// STATUS/PRIORITY COLORS
// =============================================================================

export const statusColors: Record<string, string> = {
  ASSIGNED: colors.mutedText,
  IN_PROGRESS: colors.primaryBlue,
  COMPLETED: colors.warning,
  CLOSED: colors.success,
};

export const priorityColors: Record<string, string> = {
  LOW: colors.success,
  MEDIUM: colors.warning,
  HIGH: "#ea580c",
  URGENT: colors.error,
};

// =============================================================================
// BRANDING
// =============================================================================

export const branding = {
  name: "fairlx",
  tagline: "Enterprise Workspace Platform",
  websiteUrl: "https://fairlx.com",
  supportEmail: "support@fairlx.com",
  copyright: "© 2025 Stemlen. All rights reserved.",
  footerMessage: "You received this email because you're part of a workspace on Fairlx",
};

// =============================================================================
// RESPONSIVE EMAIL WRAPPER
// =============================================================================

/**
 * Creates a responsive email wrapper with consistent branding
 */
export function createEmailWrapper(content: string, preheader?: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge" /><!--<![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-content { padding: 24px 20px !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .hide-mobile { display: none !important; }
      .mobile-center { text-align: center !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.backgroundMain}; font-family: ${typography.fontStack};">
  ${preheader ? `
  <!-- Preheader text (hidden) -->
  <div style="display: none; font-size: 1px; color: ${colors.backgroundMain}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>
  ` : ''}
  
  <!-- Email Body -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.backgroundMain};">
    <tr>
      <td style="padding: 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-container" style="margin: 0 auto; max-width: 560px;">
          
          <!-- Logo Header -->
          <tr>
            <td style="padding: 0 0 32px 0; text-align: center;">
              <span style="font-size: 28px; font-weight: 700; color: ${colors.primaryBlue}; font-family: ${typography.fontStack}; letter-spacing: -0.5px;">fairlx<span style="color: ${colors.primaryBlue};">.</span></span>
            </td>
          </tr>
          
          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.cardBackground}; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);">
                <tr>
                  <td class="email-content" style="padding: 40px 36px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 24px 0 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: ${colors.mutedText}; font-size: ${typography.sizes.caption}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">
                ${branding.footerMessage}
              </p>
              <p style="margin: 0 0 8px 0; color: ${colors.lightText}; font-size: ${typography.sizes.caption}; font-family: ${typography.fontStack};">
                <a href="mailto:${branding.supportEmail}" style="color: ${colors.primaryBlue}; text-decoration: none;">Help</a>
                <span style="padding: 0 6px;">·</span>
                <a href="${branding.websiteUrl}/privacy" style="color: ${colors.primaryBlue}; text-decoration: none;">Privacy</a>
                <span style="padding: 0 6px;">·</span>
                <a href="${branding.websiteUrl}/terms" style="color: ${colors.primaryBlue}; text-decoration: none;">Terms</a>
              </p>
              <p style="margin: 0; color: ${colors.lightText}; font-size: ${typography.sizes.caption}; font-family: ${typography.fontStack};">
                ${branding.copyright}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

/**
 * Create a primary CTA button
 */
export function createPrimaryButton(text: string, url: string, color: string = colors.primaryBlue): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
  <tr>
    <td style="border-radius: 8px; background-color: ${color};">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: ${typography.sizes.body}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack}; text-decoration: none; border-radius: 8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
  `.trim();
}

/**
 * Create a secondary/outline button
 */
export function createSecondaryButton(text: string, url: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
  <tr>
    <td style="border-radius: 8px; border: 1px solid ${colors.borderColor}; background-color: ${colors.cardBackground};">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 24px; color: ${colors.bodyText}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.medium}; font-family: ${typography.fontStack}; text-decoration: none; border-radius: 8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
  `.trim();
}

/**
 * Create a status/priority badge
 */
export function createBadge(text: string, backgroundColor: string, textColor: string = "#ffffff"): string {
  return `<span style="display: inline-block; padding: 4px 10px; background-color: ${backgroundColor}; color: ${textColor}; border-radius: 4px; font-size: ${typography.sizes.caption}; font-weight: ${typography.weights.semibold}; text-transform: uppercase; letter-spacing: 0.3px; font-family: ${typography.fontStack};">${text}</span>`;
}

/**
 * Create a notification type badge
 */
export function createNotificationBadge(emoji: string, text: string, bgColor: string, textColor: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
  <tr>
    <td style="padding: 8px 14px; background-color: ${bgColor}; border-radius: 6px;">
      <span style="color: ${textColor}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">${emoji} ${text}</span>
    </td>
  </tr>
</table>
  `.trim();
}

/**
 * Create a content card with border accent
 */
export function createContentCard(content: string, accentColor: string = colors.primaryBlue): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
  <tr>
    <td style="padding: 16px 20px; background-color: ${colors.backgroundLight}; border-left: 3px solid ${accentColor}; border-radius: 0 8px 8px 0;">
      ${content}
    </td>
  </tr>
</table>
  `.trim();
}

/**
 * Create an alert box
 */
export function createAlertBox(emoji: string, title: string, message: string, bgColor: string, borderColor: string, textColor: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
  <tr>
    <td style="padding: 16px; background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="width: 32px; vertical-align: top; font-size: 20px;">${emoji}</td>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 4px 0; color: ${textColor}; font-size: ${typography.sizes.small}; font-weight: ${typography.weights.semibold}; font-family: ${typography.fontStack};">${title}</p>
            <p style="margin: 0; color: ${textColor}; font-size: ${typography.sizes.small}; line-height: ${typography.lineHeight.relaxed}; font-family: ${typography.fontStack};">${message}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
  `.trim();
}

/**
 * Create a simple divider
 */
export function createDivider(): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
  <tr>
    <td style="border-bottom: 1px solid ${colors.borderColor};"></td>
  </tr>
</table>
  `.trim();
}

/**
 * Get status color from status string
 */
export function getStatusColor(status: string): string {
  return statusColors[status] || colors.mutedText;
}

/**
 * Get priority color from priority string
 */
export function getPriorityColor(priority: string): string {
  return priorityColors[priority] || colors.mutedText;
}

/**
 * Format status text (replace underscores with spaces)
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}
