/**
 * Email Template Utilities
 * 
 * Helper functions for email template generation and formatting.
 */

/**
 * Generates a public Appwrite storage file URL that works in email clients.
 * 
 * The URL format is: {endpoint}/storage/buckets/{bucketId}/files/{fileId}/view?project={projectId}
 * 
 * IMPORTANT: The storage bucket must have public read permissions for this to work.
 * Configure this in Appwrite Console > Storage > Bucket Settings > Permissions
 * 
 * @param fileId - The Appwrite file ID
 * @param bucketId - The storage bucket ID
 * @returns Public URL string
 */
export function getPublicFileUrl(fileId: string, bucketId: string): string {
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

    // Return undefined for data: URLs and other protocols
    // This will trigger the fallback to initial letter placeholder in email templates
    return undefined;
}
