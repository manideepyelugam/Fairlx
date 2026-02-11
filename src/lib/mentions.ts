/**
 * Mention Parser
 * 
 * Extract @mentioned user IDs from text content.
 * Handles both TipTap mention HTML format and plain text @username format.
 */

/**
 * Extract mentioned user IDs from text content
 * 
 * @param text - The text/HTML content to parse
 * @returns Array of unique user IDs that were mentioned
 * 
 * @example
 * // TipTap format
 * extractMentions('<span data-type="mention" data-id="user123">@John</span>');
 * // Returns: ['user123']
 * 
 * // Plain text format (fallback)
 * extractMentions('Hello @john.doe, please review');
 * // Returns: ['john.doe']
 */
export function extractMentions(text: string): string[] {
    const mentions: string[] = [];

    // Match TipTap mention format: <span data-type="mention" data-id="userId">
    const tiptapRegex = /data-type="mention"\s+data-id="([^"]+)"|data-id="([^"]+)"\s+data-type="mention"/g;
    let match;
    while ((match = tiptapRegex.exec(text)) !== null) {
        mentions.push(match[1] || match[2]);
    }

    // Match plain text @Name[userId] format used by MentionInput
    // This format embeds the userId in brackets for parsing
    const bracketMentionRegex = /@[^\[\]]+\[([^\[\]]+)\]/g;
    while ((match = bracketMentionRegex.exec(text)) !== null) {
        if (!mentions.includes(match[1])) {
            mentions.push(match[1]);
        }
    }

    // Return unique mentions
    return Array.from(new Set(mentions));
}

/**
 * Extract a text snippet from content for use in notifications
 * Strips HTML tags and truncates to specified length
 * 
 * @param content - The content to extract snippet from
 * @param maxLength - Maximum length of snippet (default: 120)
 * @returns Clean text snippet
 */
export function extractSnippet(content: string, maxLength: number = 120): string {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (text.length <= maxLength) {
        return text;
    }

    return text.slice(0, maxLength - 3) + '...';
}
