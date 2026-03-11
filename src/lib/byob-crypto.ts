import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * BYOB Environment Encryption — AES-256-GCM
 *
 * Encrypts and decrypts the full env blob stored in byob_tenants.
 * Key is sourced from BYOB_ENCRYPTION_SECRET (32-byte hex string).
 *
 * SECURITY:
 * - GCM mode provides authenticated encryption (integrity + confidentiality)
 * - Each encryption uses a fresh random IV
 * - Auth tag prevents tampering
 */

const ALG = "aes-256-gcm" as const;

function getKey(): Buffer {
    const secret = process.env.BYOB_ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error("BYOB_ENCRYPTION_SECRET is not configured");
    }
    const key = Buffer.from(secret, "hex");
    if (key.length !== 32) {
        throw new Error(
            `BYOB_ENCRYPTION_SECRET must be 32 bytes (64 hex chars), got ${key.length} bytes`
        );
    }
    return key;
}

/**
 * Encrypt a JSON env string using AES-256-GCM.
 * Returns the encrypted payload, IV, and auth tag — all base64-encoded.
 */
export function encryptEnv(envJson: string): {
    encrypted: string;
    iv: string;
    tag: string;
} {
    const key = getKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALG, key, iv);

    let encrypted = cipher.update(envJson, "utf8", "base64");
    encrypted += cipher.final("base64");

    const tag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
    };
}

/**
 * Decrypt an AES-256-GCM encrypted env blob.
 * All inputs are base64-encoded strings from encryptEnv().
 */
export function decryptEnv(
    encrypted: string,
    iv: string,
    tag: string
): string {
    const key = getKey();
    const decipher = createDecipheriv(
        ALG,
        key,
        Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(tag, "base64"));

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
