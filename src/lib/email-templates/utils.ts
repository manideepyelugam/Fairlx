/**
 * Email Template Utilities
 * 
 * Helper functions for email template generation and formatting.
 */

/**
 * Generates a public file URL that works in email clients.
 * 
 * Supports both R2 (via R2_PUBLIC_URL) and Appwrite storage.
 * 
 * For R2: Returns {R2_PUBLIC_URL}/{bucketId}/{fileId}
 * For Appwrite: Returns {endpoint}/storage/buckets/{bucketId}/files/{fileId}/view?project={projectId}
 * 
 * IMPORTANT: The storage bucket/R2 bucket must have public read permissions for this to work.
 * 
 * @param fileId - The file ID
 * @param bucketId - The storage bucket ID
 * @returns Public URL string
 */
export function getPublicFileUrl(fileId: string, bucketId: string): string {
    // Check if R2 is configured with a public URL
    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    if (r2PublicUrl) {
        return `${r2PublicUrl}/${bucketId}/${fileId}`;
    }

    // Fall back to Appwrite URL format
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT!;

    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
}

/**
 * Checks if a URL is safe for use in email templates.
 * 
 * Email clients (Gmail, Outlook, Yahoo, Apple Mail, etc.) block base64 data URLs
 * for security reasons. This function filters out non-HTTP URLs to ensure
 * emails render correctly with fallback to placeholder (initial letter).
 * 
 * @param logoUrl - The logo URL to check (may be http/https or data:image/...)
 * @returns The URL if it's a valid HTTP/HTTPS URL, undefined otherwise
 */
export function getEmailSafeLogoUrl(logoUrl: string | undefined): string | undefined {
    if (!logoUrl) return undefined;

    // Only allow HTTP/HTTPS URLs - email clients block data: URLs
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        return logoUrl;
    }

    // Convert relative proxy URLs to absolute URLs for email clients
    if (logoUrl.startsWith('/api/storage/')) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (appUrl) {
            return `${appUrl}${logoUrl}`;
        }
    }

    // Return undefined for data: URLs and other protocols
    // This will trigger the fallback to initial letter placeholder in email templates
    return undefined;
}
