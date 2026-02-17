import crypto from "crypto";
import { TWO_FACTOR_ENCRYPTION_SECRET } from "@/config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a TOTP secret using AES-256-GCM
 */
export function encryptSecret(secret: string): string {
    if (!TWO_FACTOR_ENCRYPTION_SECRET) {
        throw new Error("TWO_FACTOR_ENCRYPTION_SECRET is not configured");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(TWO_FACTOR_ENCRYPTION_SECRET, "hex"),
        iv
    );

    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Return IV + AuthTag + EncryptedSecret as hex
    return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}

/**
 * Decrypts a TOTP secret using AES-256-GCM
 */
export function decryptSecret(encryptedHex: string): string {
    if (!TWO_FACTOR_ENCRYPTION_SECRET) {
        throw new Error("TWO_FACTOR_ENCRYPTION_SECRET is not configured");
    }

    const data = Buffer.from(encryptedHex, "hex");

    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(TWO_FACTOR_ENCRYPTION_SECRET, "hex"),
        iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
}

/**
 * Hashes an OTP code or recovery code using SHA-256
 */
export function hashValue(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Performs a constant-time comparison of two strings to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
