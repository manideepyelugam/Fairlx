/**
 * BYOB Crypto — Unit Tests
 *
 * Tests for AES-256-GCM encrypt/decrypt of BYOB tenant env blobs.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// We need to mock "server-only" since Vitest runs in Node without Next.js
vi.mock("server-only", () => ({}));

// Set a valid test encryption key (32 bytes = 64 hex chars)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("BYOB Crypto", () => {
    beforeEach(() => {
        vi.stubEnv("BYOB_ENCRYPTION_SECRET", TEST_KEY);
    });

    it("should encrypt and decrypt env vars round-trip", async () => {
        const { encryptEnv, decryptEnv } = await import("@/lib/byob-crypto");

        const envJson = JSON.stringify({
            NEXT_PUBLIC_APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
            NEXT_PUBLIC_APPWRITE_PROJECT: "my-project",
            NEXT_APPWRITE_KEY: "super-secret-key-12345",
        });

        const { encrypted, iv, tag } = encryptEnv(envJson);
        const decrypted = decryptEnv(encrypted, iv, tag);

        expect(decrypted).toBe(envJson);
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(envJson));
    });

    it("should produce different ciphertext for same plaintext (fresh IV)", async () => {
        const { encryptEnv } = await import("@/lib/byob-crypto");

        const envJson = JSON.stringify({ KEY: "value" });

        const result1 = encryptEnv(envJson);
        const result2 = encryptEnv(envJson);

        // IVs should differ (random)
        expect(result1.iv).not.toBe(result2.iv);
        // Encrypted output should differ
        expect(result1.encrypted).not.toBe(result2.encrypted);
    });

    it("should fail to decrypt with wrong tag (tamper detection)", async () => {
        const { encryptEnv, decryptEnv } = await import("@/lib/byob-crypto");

        const { encrypted, iv } = encryptEnv(JSON.stringify({ KEY: "value" }));

        // Tampered tag
        const wrongTag = Buffer.from("aaaaaaaaaaaaaaaa").toString("base64");

        expect(() => decryptEnv(encrypted, iv, wrongTag)).toThrow();
    });

    it("should fail when BYOB_ENCRYPTION_SECRET is missing", async () => {
        vi.stubEnv("BYOB_ENCRYPTION_SECRET", "");

        // Re-import to pick up the new env
        const mod = await import("@/lib/byob-crypto");

        expect(() =>
            mod.encryptEnv(JSON.stringify({ KEY: "value" }))
        ).toThrow("BYOB_ENCRYPTION_SECRET");
    });

    it("should fail when BYOB_ENCRYPTION_SECRET is wrong length", async () => {
        vi.stubEnv("BYOB_ENCRYPTION_SECRET", "tooshort");

        const mod = await import("@/lib/byob-crypto");

        expect(() =>
            mod.encryptEnv(JSON.stringify({ KEY: "value" }))
        ).toThrow("32 bytes");
    });
});

describe("BYOB Types", () => {
    it("should export all status enums", async () => {
        const { BYOBStatus, BYOBDbInitStatus, BYOBSetupStep } = await import(
            "@/features/byob/types"
        );

        expect(BYOBStatus.PENDING_SETUP).toBe("PENDING_SETUP");
        expect(BYOBStatus.SETUP_IN_PROGRESS).toBe("SETUP_IN_PROGRESS");
        expect(BYOBStatus.ACTIVE).toBe("ACTIVE");
        expect(BYOBStatus.SUSPENDED).toBe("SUSPENDED");

        expect(BYOBDbInitStatus.NOT_STARTED).toBe("NOT_STARTED");
        expect(BYOBDbInitStatus.IN_PROGRESS).toBe("IN_PROGRESS");
        expect(BYOBDbInitStatus.COMPLETED).toBe("COMPLETED");
        expect(BYOBDbInitStatus.FAILED).toBe("FAILED");

        expect(BYOBSetupStep.CREATE_ORG).toBe(0);
        expect(BYOBSetupStep.DB_INITIALIZATION).toBe(3);
    });
});

describe("BYOB Schemas", () => {
    it("should validate correct org slugs", async () => {
        const { registerSchema } = await import("@/features/byob/schemas");

        const valid = registerSchema.safeParse({
            orgSlug: "my-company",
            orgName: "My Company",
        });
        expect(valid.success).toBe(true);
    });

    it("should reject invalid org slugs", async () => {
        const { registerSchema } = await import("@/features/byob/schemas");

        // Too short
        expect(
            registerSchema.safeParse({ orgSlug: "ab", orgName: "X" }).success
        ).toBe(false);

        // Uppercase
        expect(
            registerSchema.safeParse({ orgSlug: "MyCompany", orgName: "My Co" }).success
        ).toBe(false);

        // Starting with hyphen
        expect(
            registerSchema.safeParse({ orgSlug: "-my-company", orgName: "My Co" }).success
        ).toBe(false);
    });

    it("should validate credentials schema", async () => {
        const { validateCredentialsSchema } = await import(
            "@/features/byob/schemas"
        );

        const valid = validateCredentialsSchema.safeParse({
            endpoint: "https://cloud.appwrite.io/v1",
            project: "my-project-id",
            apiKey: "standard_abc123...",
        });
        expect(valid.success).toBe(true);

        // Reject non-HTTPS
        const invalid = validateCredentialsSchema.safeParse({
            endpoint: "http://insecure.com/v1",
            project: "proj",
            apiKey: "key",
        });
        expect(invalid.success).toBe(false);
    });
});

describe("BYOB Constants", () => {
    it("should have 5 setup steps", async () => {
        const { SETUP_STEPS } = await import("@/features/byob/constants");
        expect(SETUP_STEPS).toHaveLength(5);
    });

    it("should validate slug regex", async () => {
        const { ORG_SLUG_REGEX } = await import("@/features/byob/constants");

        expect(ORG_SLUG_REGEX.test("my-company")).toBe(true);
        expect(ORG_SLUG_REGEX.test("acme42")).toBe(true);
        expect(ORG_SLUG_REGEX.test("a")).toBe(false);
        expect(ORG_SLUG_REGEX.test("My-Company")).toBe(false);
        expect(ORG_SLUG_REGEX.test("-invalid")).toBe(false);
    });
});
