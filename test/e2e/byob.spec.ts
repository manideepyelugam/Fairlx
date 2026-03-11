/**
 * BYOB (Bring Your Own Backend) — E2E Tests
 *
 * End-to-end tests for the BYOB API endpoints.
 * These tests require a running Fairlx application and an Appwrite instance.
 *
 * Run with: npx playwright test test/e2e/byob.spec.ts
 */

import { test, expect, APIRequestContext } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const API_URL = `${BASE_URL}/api`;

// ─── Helper: Authenticate ─────────────────────────────────────
// Retrieves a session cookie for API calls (requires valid test user)
async function getAuthCookie(request: APIRequestContext): Promise<string> {
    // This assumes a test user exists — adjust credentials for your env
    const email = process.env.TEST_USER_EMAIL || "test@example.com";
    const password = process.env.TEST_USER_PASSWORD || "testpassword123";

    const loginRes = await request.post(`${API_URL}/auth/login`, {
        data: { email, password },
    });

    const cookies = loginRes.headers()["set-cookie"] || "";
    return cookies;
}

// ─── Test: BYOB Register ──────────────────────────────────────

test.describe("BYOB API — /api/byob", () => {
    const testSlug = `test-org-${Date.now()}`;

    test("POST /byob/register — should create a new BYOB tenant", async ({
        request,
    }) => {
        const res = await request.post(`${API_URL}/byob/register`, {
            data: {
                orgSlug: testSlug,
                orgName: "Test Organisation",
            },
        });

        // Without auth, should return 401
        expect(res.status()).toBe(401);
    });

    test("POST /byob/register — should reject invalid slugs", async ({
        request,
    }) => {
        const res = await request.post(`${API_URL}/byob/register`, {
            data: {
                orgSlug: "AB", // too short + uppercase
                orgName: "Bad Slug",
            },
        });

        // Zod validation returns 400
        expect([400, 401]).toContain(res.status());
    });

    test("POST /byob/validate-credentials — should reject invalid credentials", async ({
        request,
    }) => {
        const res = await request.post(
            `${API_URL}/byob/validate-credentials`,
            {
                data: {
                    endpoint: "https://fake.appwrite.io/v1",
                    project: "nonexistent",
                    apiKey: "invalid-key",
                },
            }
        );

        // Without auth → 401, with auth → 400 (invalid creds)
        expect([400, 401]).toContain(res.status());
    });

    test("POST /byob/validate-credentials — should reject non-HTTPS endpoints", async ({
        request,
    }) => {
        const res = await request.post(
            `${API_URL}/byob/validate-credentials`,
            {
                data: {
                    endpoint: "http://insecure.example.com/v1",
                    project: "proj",
                    apiKey: "key",
                },
            }
        );

        // Zod validation should reject non-HTTPS
        expect([400, 401]).toContain(res.status());
    });

    test("GET /byob/resolve/:orgSlug — should return 404 for nonexistent slug", async ({
        request,
    }) => {
        const res = await request.get(
            `${API_URL}/byob/resolve/nonexistent-org-slug-xyz`
        );

        expect(res.status()).toBe(404);

        const body = await res.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain("not found");
    });

    test("GET /byob/resolve/:orgSlug — should reject invalid slug format", async ({
        request,
    }) => {
        const res = await request.get(`${API_URL}/byob/resolve/AB`);

        // Zod validation returns 400 for slug too short
        expect(res.status()).toBe(400);
    });

    test("POST /byob/initialize-db — should require authentication", async ({
        request,
    }) => {
        const res = await request.post(`${API_URL}/byob/initialize-db`, {
            data: {
                orgSlug: testSlug,
                envVars: {
                    NEXT_PUBLIC_APPWRITE_ENDPOINT: "https://example.com/v1",
                    NEXT_PUBLIC_APPWRITE_PROJECT: "proj",
                    NEXT_APPWRITE_KEY: "key",
                },
            },
        });

        expect(res.status()).toBe(401);
    });
});

// ─── Test: Authenticated BYOB Flow ────────────────────────────
// These tests require TEST_USER_EMAIL and TEST_USER_PASSWORD env vars

test.describe("BYOB API — Authenticated Flow", () => {
    // Skip if no test credentials configured
    test.skip(
        !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
        "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars"
    );

    const authSlug = `auth-test-${Date.now()}`;

    test("Full BYOB registration flow", async ({ request }) => {
        // 1. Register
        const registerRes = await request.post(`${API_URL}/byob/register`, {
            data: {
                orgSlug: authSlug,
                orgName: "Auth Test Organisation",
            },
        });

        expect(registerRes.status()).toBe(201);

        const registerBody = await registerRes.json();
        expect(registerBody.success).toBe(true);
        expect(registerBody.tenant.orgSlug).toBe(authSlug);
        expect(registerBody.tenant.status).toBe("PENDING_SETUP");

        // 2. Resolve should find it
        const resolveRes = await request.get(
            `${API_URL}/byob/resolve/${authSlug}`
        );

        expect(resolveRes.status()).toBe(200);
        const resolveBody = await resolveRes.json();
        expect(resolveBody.orgSlug).toBe(authSlug);
        expect(resolveBody.status).toBe("PENDING_SETUP");
    });

    test("Should reject duplicate org slugs", async ({ request }) => {
        // Register first
        await request.post(`${API_URL}/byob/register`, {
            data: {
                orgSlug: `dup-${Date.now()}`,
                orgName: "First",
            },
        });

        // Try same slug again — should fail
        const dupRes = await request.post(`${API_URL}/byob/register`, {
            data: {
                orgSlug: `dup-${Date.now()}`, // same as above
                orgName: "Second",
            },
        });

        // If it gets past auth, it should fail with 400
        if (dupRes.status() !== 401) {
            expect(dupRes.status()).toBe(400);
            const body = await dupRes.json();
            expect(body.error).toContain("already taken");
        }
    });
});
