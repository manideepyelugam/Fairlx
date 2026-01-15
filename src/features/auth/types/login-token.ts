import { Models } from "node-appwrite";

/**
 * Login Token Purpose
 */
export type LoginTokenPurpose = "FIRST_LOGIN";

/**
 * Login Token for secure first-login magic links
 * 
 * SECURITY:
 * - Only tokenHash is stored (raw token never persisted)
 * - Single-use (usedAt set on first use)
 * - Expires after 24 hours
 * - Cannot bypass password reset
 */
export type LoginToken = Models.Document & {
    /** User ID this token belongs to */
    userId: string;
    /** Organization ID (for audit trail) */
    orgId: string;
    /** SHA-256 hash of the raw token */
    tokenHash: string;
    /** When token expires (24h from creation) */
    expiresAt: string;
    /** When token was used (null if unused) */
    usedAt: string | null;
    /** Purpose of the token */
    purpose: LoginTokenPurpose;
};
