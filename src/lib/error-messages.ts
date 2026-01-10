/**
 * Error Message Mapping
 * 
 * Replace technical errors with human-readable copy.
 * Maps HTTP status codes and error strings to friendly messages.
 */

export interface ErrorMapping {
    title: string;
    message: string;
    action?: string;
}

/**
 * HTTP Status Code Mappings
 */
export const HTTP_ERROR_MESSAGES: Record<number, ErrorMapping> = {
    400: {
        title: "Something went wrong",
        message: "The request couldn't be processed. Please try again.",
    },
    401: {
        title: "Session expired",
        message: "Please sign in again to continue.",
        action: "Sign In",
    },
    403: {
        title: "Access restricted",
        message: "You don't have access to this yet. Contact your workspace admin for help.",
    },
    404: {
        title: "Not found",
        message: "We couldn't find what you're looking for.",
    },
    429: {
        title: "Slow down",
        message: "You're making too many requests. Please wait a moment.",
    },
    500: {
        title: "Something went wrong",
        message: "We're having trouble on our end. Please try again later.",
    },
    503: {
        title: "Temporarily unavailable",
        message: "We're doing some maintenance. Please try again in a few minutes.",
    },
};

/**
 * Specific Error String Mappings
 */
export const SPECIFIC_ERROR_MESSAGES: Record<string, ErrorMapping> = {
    // Workspace limits
    "Personal accounts can only have one workspace": {
        title: "Workspace limit reached",
        message: "Personal accounts can only have one workspace.",
        action: "Upgrade to Organization to create more workspaces.",
    },
    "Upgrade to Organization to create more": {
        title: "Upgrade required",
        message: "Upgrade to Organization to unlock this feature.",
        action: "Upgrade Now",
    },

    // Organization
    "Organization must have at least one owner": {
        title: "Owner required",
        message: "Every organization needs at least one owner. Transfer ownership before removing yourself.",
    },
    "Only organization owner can delete": {
        title: "Permission denied",
        message: "Only the organization owner can perform this action.",
    },
    "Account is already an organization": {
        title: "Already converted",
        message: "Your account is already an organization.",
    },

    // Authentication
    "Unauthorized": {
        title: "Access denied",
        message: "You need to sign in to continue.",
        action: "Sign In",
    },
    "Not a member of this workspace": {
        title: "Not a member",
        message: "You're not a member of this workspace. Ask the owner for an invite.",
    },

    // Billing & Account Status
    "ACCOUNT_SUSPENDED": {
        title: "Account suspended",
        message: "Your account is suspended due to an unpaid invoice.",
        action: "Update your payment method to restore access.",
    },
    "BILLING_SUSPENDED": {
        title: "Account suspended",
        message: "Write access is temporarily restricted. Your data is safe.",
        action: "Please update your payment method.",
    },
    "BILLING_DUE": {
        title: "Payment overdue",
        message: "Your account has an unpaid invoice.",
        action: "Please pay soon to avoid service interruption.",
    },
    "BILLING_NOT_FOUND": {
        title: "Billing not configured",
        message: "Please set up billing to continue using this feature.",
        action: "Set Up Billing",
    },
    "BILLING_CYCLE_LOCKED": {
        title: "Billing cycle closed",
        message: "This billing cycle has been finalized.",
    },
    "Your account has been suspended": {
        title: "Account suspended",
        message: "Your account is suspended due to an unpaid invoice.",
        action: "Update Payment",
    },

    // Access & Permissions
    "NO_WORKSPACE_ACCESS": {
        title: "Access denied",
        message: "You don't have access to this workspace.",
        action: "Contact the workspace owner for an invite.",
    },
    "CROSS_ORG_ACCESS_DENIED": {
        title: "Access denied",
        message: "You cannot access resources from another organization.",
    },
    "INSUFFICIENT_ROLE": {
        title: "Permission denied",
        message: "You don't have the required role to perform this action.",
        action: "Contact a workspace admin for help.",
    },
    "Forbidden": {
        title: "Access restricted",
        message: "You don't have permission for this action.",
    },
    "Not allowed": {
        title: "Action not allowed",
        message: "This action is not permitted in the current context.",
    },
    "You don't have permission": {
        title: "Permission denied",
        message: "You don't have the required permissions for this action.",
    },

    // Generic
    "Network Error": {
        title: "Connection issue",
        message: "Check your internet connection and try again.",
        action: "Retry",
    },
};

/**
 * Get human-readable error message
 */
export function getErrorMessage(error: unknown): ErrorMapping {
    // Check for HTTP status
    if (typeof error === "object" && error !== null) {
        const errorObj = error as { status?: number; message?: string };

        if (errorObj.status && HTTP_ERROR_MESSAGES[errorObj.status]) {
            return HTTP_ERROR_MESSAGES[errorObj.status];
        }

        if (errorObj.message && SPECIFIC_ERROR_MESSAGES[errorObj.message]) {
            return SPECIFIC_ERROR_MESSAGES[errorObj.message];
        }

        // Check if message contains a known pattern
        if (errorObj.message) {
            for (const [pattern, mapping] of Object.entries(SPECIFIC_ERROR_MESSAGES)) {
                if (errorObj.message.includes(pattern)) {
                    return mapping;
                }
            }
        }
    }

    // String error
    if (typeof error === "string" && SPECIFIC_ERROR_MESSAGES[error]) {
        return SPECIFIC_ERROR_MESSAGES[error];
    }

    // Default fallback
    return {
        title: "Something went wrong",
        message: "An unexpected error occurred. Please try again.",
    };
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: unknown): { title: string; description: string } {
    const mapping = getErrorMessage(error);
    return {
        title: mapping.title,
        description: mapping.action ? `${mapping.message} ${mapping.action}` : mapping.message,
    };
}
