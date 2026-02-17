import crypto from "crypto";

/**
 * Generates 10 cryptographically secure recovery codes
 * Format: XXXX-XXXX (8 character alphanumeric)
 */
export function generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
        // Generate 8 characters (using 4 bytes)
        const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
        const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
        codes.push(formatted);
    }
    return codes;
}
