/**
 * Base Email Template
 * 
 * Uses the responsive email wrapper and components from theme.ts
 */

import {
  colors,
  createEmailWrapper,
  createPrimaryButton,
  getStatusColor as themeGetStatusColor,
  getPriorityColor as themePriorityColor,
  formatStatus as themeFormatStatus,
} from "./theme";

// Re-export theme components for backwards compatibility
export { colors, typography, branding } from "./theme";
export { createPrimaryButton, createBadge, createNotificationBadge, createContentCard, createAlertBox, createDivider } from "./theme";

/**
 * Base email template wrapper
 * 
 * @param content - The main email content HTML
 * @param title - Optional email title (used for preheader)
 * @returns Complete HTML email string
 */
export function baseEmailTemplate(content: string, title?: string): string {
  return createEmailWrapper(content, title);
}

/**
 * Create a styled button (legacy function, use createPrimaryButton instead)
 * @deprecated Use createPrimaryButton from theme.ts instead
 */
export function createButton(text: string, url: string, color: string = colors.primaryBlue): string {
  return createPrimaryButton(text, url, color);
}

/**
 * Get status color from status string
 */
export function getStatusColor(status: string): string {
  return themeGetStatusColor(status);
}

/**
 * Get priority color from priority string
 */
export function getPriorityColor(priority: string): string {
  return themePriorityColor(priority);
}

/**
 * Format status text
 */
export function formatStatus(status: string): string {
  return themeFormatStatus(status);
}
