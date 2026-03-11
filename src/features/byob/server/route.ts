import "server-only";

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie } from "hono/cookie";
import { Client, Account, ID } from "node-appwrite";
// Removed unused import 'z'

import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/redis";
import { AUTH_COOKIE } from "@/features/auth/constants";

import {
    registerSchema,
    validateCredentialsSchema,
    initializeDbSchema,
    resolveOrgSchema,
    createOwnerAccountSchema,
} from "../schemas";
import {
    registerTenant,
    validateCredentials,
    initializeDatabase,
    resolveTenant,
    getBYOBTenantBySlug,
    setTenantOwner,
} from "./byob-service";
import { createAdminClient } from "@/lib/appwrite";

/**
 * BYOB (Bring Your Own Backend) API Routes
 *
 * POST /byob/register              → Create a new BYOB tenant record
 * POST /byob/validate-credentials  → Test Appwrite credentials before commit
 * POST /byob/initialize-db         → Encrypt env + run full DB init (SSE stream)
 * POST /byob/re-run-db-init        → Re-run DB init for failed/partial setups
 * POST /byob/create-owner-account  → Create the BYOB org owner's Fairlx account
 * GET  /byob/resolve/:orgSlug      → Resolve tenant info (public-safe, no secret)
 */

// ─── Shared SSE stream builder ────────────────────────────────────────────────
//
// Push-based TransformStream. The job writes events directly as they happen.
// Each event is awaited so the chunk is flushed to the client immediately.
//
function buildInitStream(orgSlug: string, envVars: Record<string, string>): Response {
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const enc = new TextEncoder();

    async function push(payload: Record<string, unknown>): Promise<void> {
        try {
            await writer.write(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
            // Client disconnected.
        }
    }

    (async () => {
        try {
            const result = await initializeDatabase(orgSlug, envVars, async (info) => {
                await push({ type: "progress", ...info });
            });
            await push({ type: "complete", result });
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            await push({ type: "error", error });
        } finally {
            try { await writer.close(); } catch { /* already closed */ }
        }
    })();

    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
        },
    });
}


// ─── Routes ───────────────────────────────────────────────────────────────────

const app = new Hono()

    // ─── Register Tenant ─────────────────────────────────────────────────────
    .post(
        "/register",
        rateLimitMiddleware(RATE_LIMITS.BYOB_REGISTER),
        zValidator("json", registerSchema),
        async (c) => {
            const { orgSlug, orgName } = c.req.valid("json");

            let ownerUserId: string | undefined;
            try {
                const session = getCookie(c, AUTH_COOKIE);
                if (session) {
                    const tempClient = new Client()
                        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
                        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
                        .setSession(session);
                    const user = await new Account(tempClient).get();
                    ownerUserId = user.$id;
                }
            } catch {
                // Not authenticated — continue as anonymous.
            }

            try {
                const tenant = await registerTenant(orgSlug, orgName, ownerUserId);
                return c.json({ success: true, tenant }, 201);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return c.json({ success: false, error: message }, 400);
            }
        }
    )

    // ─── Validate Credentials ─────────────────────────────────────────────────
    .post(
        "/validate-credentials",
        zValidator("json", validateCredentialsSchema),
        async (c) => {
            const { endpoint, project, apiKey } = c.req.valid("json");
            const result = await validateCredentials(endpoint, project, apiKey);
            return c.json(result, result.valid ? 200 : 400);
        }
    )

    // ─── Initialize Database (SSE) ────────────────────────────────────────────
    .post(
        "/initialize-db",
        zValidator("json", initializeDbSchema),
        async (c) => {
            const { orgSlug, envVars } = c.req.valid("json");
            return buildInitStream(orgSlug, envVars);
        }
    )

    // ─── Re-run DB Init ───────────────────────────────────────────────────────
    .post(
        "/re-run-db-init",
        zValidator("json", initializeDbSchema),
        async (c) => {
            const { orgSlug, envVars } = c.req.valid("json");
            return buildInitStream(orgSlug, envVars);
        }
    )

    // ─── Create Owner Account (Step 4) ────────────────────────────────────────
    /**
     * POST /byob/create-owner-account
     *
     * Called at the end of the BYOB setup wizard (Step 4) to create the
     * owner's Fairlx Cloud user account and bind it to the tenant record.
     *
     * Preconditions enforced here:
     *   - org must exist in byob_tenants
     *   - org status must be ACTIVE (DB init completed)
     *   - ownerUserId must still be "pending" (owner not yet created)
     */
    .post(
        "/create-owner-account",
        rateLimitMiddleware(RATE_LIMITS.LOGIN),
        zValidator("json", createOwnerAccountSchema),
        async (c) => {
            const { orgSlug, name, email, password, acceptedTerms, acceptedDPA } =
                c.req.valid("json");

            // Belt-and-suspenders legal check
            if (acceptedTerms !== true || acceptedDPA !== true) {
                return c.json({ error: "Terms and DPA acceptance required." }, 400);
            }

            try {
                // 1. Verify the org exists, is ACTIVE, and has no owner yet
                const tenant = await getBYOBTenantBySlug(orgSlug);

                if (!tenant) {
                    return c.json({
                        error: `Organisation "${orgSlug}" not found.`,
                    }, 404);
                }

                if (tenant.status !== "ACTIVE") {
                    return c.json({
                        error: "Database setup must be completed before creating an owner account. Go back to step 4.",
                    }, 400);
                }

                if (tenant.ownerUserId !== "pending") {
                    return c.json({
                        error: "An owner account already exists for this organisation. Please sign in instead.",
                        alreadyExists: true,
                    }, 409);
                }

                // 2. Create the Fairlx Cloud user account
                const { account } = await createAdminClient();
                const user = await account.create(ID.unique(), email, password, name);

                // 3. Open a temporary session to set prefs
                const session = await account.createEmailPasswordSession(email, password);
                const userClient = new Client()
                    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
                    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
                    .setSession(session.secret);
                const userAccount = new Account(userClient);

                const now = new Date().toISOString();

                // 4. Set prefs — owner is pre-configured as BYOB ORG
                await userAccount.updatePrefs({
                    accountType: "ORG",
                    deploymentTier: "BYOB",
                    byobOrgSlug: orgSlug,
                    needsOnboarding: false,
                    signupCompletedAt: now,
                    acceptedTermsAt: now,
                    acceptedDPAAt: now,
                    acceptedTermsVersion: "v1",
                    acceptedDPAVersion: "v1",
                });

                // 5. Bind the real userId to the tenant record (replaces "pending")
                await setTenantOwner(tenant.$id, user.$id);

                // 6. Also set owner prefs via admin Users API (belt-and-suspenders)
                try {
                    const { users } = await createAdminClient();
                    const existingUser = await users.get(user.$id);
                    const existingPrefs = existingUser.prefs || {};
                    await users.updatePrefs(user.$id, {
                        ...existingPrefs,
                        byobOrgSlug: orgSlug,
                        deploymentTier: "BYOB",
                        accountType: "ORG",
                        needsOnboarding: false,
                        signupCompletedAt: now,
                    });
                } catch {
                    // Non-fatal — prefs were already set via session above
                }

                // 7. Audit log (best-effort)
                try {
                    const { databases } = await createAdminClient();
                    const { logOrgAudit, OrgAuditAction } = await import(
                        "@/features/organizations/audit"
                    );
                    await logOrgAudit({
                        databases,
                        organizationId: user.$id,
                        actorUserId: user.$id,
                        actionType: OrgAuditAction.USER_ACCEPTED_LEGAL,
                        metadata: {
                            acceptedAt: now,
                            termsVersion: "v1",
                            dpaVersion: "v1",
                            byobOrgSlug: orgSlug,
                            role: "BYOB_OWNER",
                            ip: c.req.header("x-forwarded-for") || "unknown",
                        },
                    });
                } catch {
                    // Non-fatal
                }

                // 8. Send verification email
                try {
                    const { databases, messaging } = await createAdminClient();
                    const { verificationHelper } = await import(
                        "@/features/auth/server/verification-helper"
                    );
                    await verificationHelper.createAndSend({
                        databases,
                        messaging,
                        userId: user.$id,
                        userName: name,
                    });
                } catch {
                    // Fallback to Appwrite default
                    try {
                        await userAccount.createVerification(
                            `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
                        );
                    } catch { /* Still non-fatal */ }
                }

                // 9. Delete temporary session (owner must verify email before signing in)
                try {
                    await userAccount.deleteSession("current");
                } catch { /* Non-fatal */ }

                return c.json({
                    success: true,
                    message: `Account created for ${name}! Check your email to verify, then sign in at /${orgSlug}/sign-in`,
                    orgSlug,
                    orgName: tenant.orgName,
                }, 201);

            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);

                // Appwrite 409 = email already registered
                if (
                    message.toLowerCase().includes("already exists") ||
                    message.toLowerCase().includes("already registered") ||
                    (err as { code?: number }).code === 409
                ) {
                    return c.json({
                        error: "An account with this email already exists. If you are the intended owner, please sign in instead.",
                    }, 409);
                }

                return c.json({ error: message }, 400);
            }
        }
    )

    // ─── Register Member ──────────────────────────────────────────────────────
    /**
     * POST /byob/register-member
     *
     * Creates a new Fairlx user account scoped to a BYOB organisation.
     */
    .post(
        "/register-member",
        rateLimitMiddleware(RATE_LIMITS.LOGIN),
        // We'll reuse the createOwnerAccountSchema as the fields are identical
        zValidator("json", createOwnerAccountSchema),
        async (c) => {
            const { orgSlug, name, email, password, acceptedTerms, acceptedDPA } =
                c.req.valid("json");

            if (acceptedTerms !== true || acceptedDPA !== true) {
                return c.json({ error: "Terms and DPA acceptance required." }, 400);
            }

            try {
                // 1. Verify the BYOB org exists and is ACTIVE
                const tenant = await getBYOBTenantBySlug(orgSlug);

                if (!tenant) {
                    return c.json({
                        error: `Organisation "${orgSlug}" not found.`,
                    }, 404);
                }

                if (tenant.status !== "ACTIVE") {
                    return c.json({
                        error: `Organisation "${tenant.orgName}" is not yet active.`,
                    }, 400);
                }

                // 2. Create the user on Fairlx Cloud Appwrite
                const { account } = await createAdminClient();
                const user = await account.create(ID.unique(), email, password, name);

                // 3. Create a temporary session to update prefs
                const session = await account.createEmailPasswordSession(email, password);

                const userClient = new Client()
                    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
                    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
                    .setSession(session.secret);

                const userAccount = new Account(userClient);

                const now = new Date().toISOString();

                // 4. Set prefs — pre-configure as BYOB ORG member
                await userAccount.updatePrefs({
                    accountType: "ORG",
                    deploymentTier: "BYOB",
                    byobOrgSlug: orgSlug,
                    needsOnboarding: false,
                    signupCompletedAt: now,
                    acceptedTermsAt: now,
                    acceptedDPAAt: now,
                    acceptedTermsVersion: "v1",
                    acceptedDPAVersion: "v1",
                });

                // 5. Audit log (best-effort)
                try {
                    const { databases } = await createAdminClient();
                    const { logOrgAudit, OrgAuditAction } = await import(
                        "@/features/organizations/audit"
                    );
                    await logOrgAudit({
                        databases,
                        organizationId: user.$id,
                        actorUserId: user.$id,
                        actionType: OrgAuditAction.USER_ACCEPTED_LEGAL,
                        metadata: {
                            acceptedAt: now,
                            termsVersion: "v1",
                            dpaVersion: "v1",
                            byobOrgSlug: orgSlug,
                            role: "BYOB_MEMBER",
                            ip: c.req.header("x-forwarded-for") || "unknown",
                        },
                    });
                } catch { /* Non-fatal */ }

                // 6. Send verification email
                try {
                    const { databases, messaging } = await createAdminClient();
                    const { verificationHelper } = await import(
                        "@/features/auth/server/verification-helper"
                    );
                    await verificationHelper.createAndSend({
                        databases,
                        messaging,
                        userId: user.$id,
                        userName: name,
                    });
                } catch {
                    try {
                        await userAccount.createVerification(
                            `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
                        );
                    } catch { /* Still non-fatal */ }
                }

                // 7. Delete the temporary session
                try {
                    await userAccount.deleteSession("current");
                } catch { /* Non-fatal */ }

                return c.json({
                    success: true,
                    message: `Account created for ${name}! Check your email to verify, then sign in at /${orgSlug}/sign-in`,
                    orgName: tenant.orgName,
                    orgSlug,
                }, 201);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                if (message.toLowerCase().includes("already exists") ||
                    message.toLowerCase().includes("already registered")) {
                    return c.json({
                        error: "An account with this email already exists.",
                    }, 400);
                }
                return c.json({ error: message }, 400);
            }
        }
    )

    // ─── Resolve Tenant (Public) ──────────────────────────────────────────────
    .get(
        "/resolve/:orgSlug",
        rateLimitMiddleware(RATE_LIMITS.BYOB_RESOLVE),
        zValidator("param", resolveOrgSchema),
        async (c) => {
            const { orgSlug } = c.req.valid("param");
            try {
                const info = await resolveTenant(orgSlug);
                return c.json({ success: true, ...info });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return c.json({ success: false, error: message }, 404);
            }
        }
    );

export default app;
