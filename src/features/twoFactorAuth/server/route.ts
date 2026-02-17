import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Account, Query, type Databases, type Storage, type Users, type Messaging, Models } from "node-appwrite";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import {
    enableTotpSchema,
    enableEmailOtpSchema,
    sendEmailOtpSchema,
    disable2FASchema,
    verify2FASchema
} from "./validations";
import { setupTotp as setupTotpLogic } from "./setupTotp";
import { verifyTotp as verifyTotpLogic } from "./verifyTotp";
import { sendEmailOtp as sendEmailOtpLogic } from "./sendEmailOtp";
import { verifyEmailOtp as verifyEmailOtpLogic } from "./verifyEmailOtp";
import { generateRecoveryCodes as generateCodesLogic } from "./generateRecoveryCodes";
import { enableTwoFactor, disableTwoFactor } from "./enableDisableTwoFactor";
import { TwoFactorRepository } from "./repository";
import { hashValue, encryptSecret } from "./security";
import { TwoFactorMethod } from "./types";
import { logOrgAudit, OrgAuditAction } from "@/features/organizations/audit";
import { AUTH_COOKIE } from "@/features/auth/constants";
import { setCookie } from "hono/cookie";

type ContextVariables = {
    account: Account;
    databases: Databases;
    storage: Storage;
    users: Users;
    messaging: Messaging;
    user: Models.User<Models.Preferences>;
};

const app = new Hono<{ Variables: ContextVariables }>()
    .post("/setup-totp", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const { secret, uri } = setupTotpLogic(user.email);

        const QRCode = await import("qrcode");
        const qrCodeUrl = await QRCode.toDataURL(uri);

        // Return encrypted secret for the verification step
        const encryptedSecret = encryptSecret(secret);

        return c.json({ data: { uri, secret: encryptedSecret, qrCodeUrl } });
    })
    .post("/enable-totp", sessionMiddleware, zValidator("json", enableTotpSchema), async (c) => {
        const { code, secret } = c.req.valid("json");
        const account = c.get("account");
        const databases = c.get("databases");
        const user = c.get("user");

        const isValid = verifyTotpLogic(code, secret);
        if (!isValid) {
            return c.json({ error: "Invalid verification code" }, 400);
        }

        // Generate recovery codes
        const recoveryCodes = generateCodesLogic();
        const hashes = recoveryCodes.map(hashValue);

        const repository = new TwoFactorRepository(databases);
        await repository.createRecoveryCodes(user.$id, hashes);

        await enableTwoFactor(account, TwoFactorMethod.TOTP, secret);

        // Audit Log
        await logOrgAudit({
            databases,
            organizationId: (user.prefs?.primaryOrganizationId as string) || user.$id,
            actorUserId: user.$id,
            actionType: "two_factor_enabled" as OrgAuditAction,
            metadata: { method: TwoFactorMethod.TOTP, ip: (c.req.header("x-forwarded-for") || "unknown") },
        });

        return c.json({ data: { recoveryCodes } });
    })
    .post("/send-email-otp", zValidator("json", sendEmailOtpSchema), async (c) => {
        const { email, tempToken } = c.req.valid("json");
        const { databases, messaging } = await createAdminClient();

        let userId: string;

        if (tempToken) {
            // 1. Verify tempToken (for login challenge)
            const { DATABASE_ID, LOGIN_TOKENS_ID } = await import("@/config");
            const crypto = await import("crypto");
            const tokenHash = crypto.createHash("sha256").update(tempToken).digest("hex");

            const tokens = await databases.listDocuments(DATABASE_ID, LOGIN_TOKENS_ID, [
                Query.equal("tokenHash", tokenHash),
                Query.equal("purpose", "2FA_CHALLENGE"),
            ]);

            if (tokens.total === 0) {
                return c.json({ error: "Invalid session" }, 401);
            }

            const loginToken = tokens.documents[0];
            if (new Date(loginToken.expiresAt) < new Date() || loginToken.usedAt) {
                return c.json({ error: "Session expired" }, 401);
            }

            userId = loginToken.userId;
        } else {
            // 2. Fallback to session (for enabling 2FA)
            // We need to manually check session since we removed sessionMiddleware
            const { getSessionUser } = await import("@/lib/session-middleware");
            const user = await getSessionUser(c);
            if (!user) {
                return c.json({ error: "Unauthorized" }, 401);
            }
            userId = user.$id;
        }

        await sendEmailOtpLogic(databases, messaging, userId, email);

        return c.json({ success: true });
    })
    .post("/enable-email-otp", sessionMiddleware, zValidator("json", enableEmailOtpSchema), async (c) => {
        const { code } = c.req.valid("json");
        const account = c.get("account");
        const databases = c.get("databases");
        const user = c.get("user");

        const isValid = await verifyEmailOtpLogic(databases, user.$id, code);
        if (!isValid) {
            return c.json({ error: "Invalid verification code" }, 400);
        }

        // Generate recovery codes
        const recoveryCodes = generateCodesLogic();
        const hashes = recoveryCodes.map(hashValue);

        const repository = new TwoFactorRepository(databases);
        await repository.createRecoveryCodes(user.$id, hashes);

        await enableTwoFactor(account, TwoFactorMethod.EMAIL);

        // Audit Log
        await logOrgAudit({
            databases,
            organizationId: (user.prefs?.primaryOrganizationId as string) || user.$id,
            actorUserId: user.$id,
            actionType: "two_factor_enabled" as OrgAuditAction,
            metadata: { method: TwoFactorMethod.EMAIL, ip: (c.req.header("x-forwarded-for") || "unknown") },
        });

        return c.json({ data: { recoveryCodes } });
    })
    .post("/disable", sessionMiddleware, zValidator("json", disable2FASchema), async (c) => {
        const { password, method } = c.req.valid("json");
        const account = c.get("account");
        const databases = c.get("databases");
        const user = c.get("user");

        // Verify password before disabling (Enterprise Security)
        try {
            await createAdminClient();
            // We can't verify password directly with Admin SDK easily without creating a session
            // But we have the current account session
            await account.createEmailPasswordSession(user.email, password);
            // If successful, we can delete the temp session
            await account.deleteSession("current");
        } catch {
            return c.json({ error: "Incorrect password" }, 401);
        }

        await disableTwoFactor(account, method);

        if (!method) {
            const repository = new TwoFactorRepository(databases);
            await repository.deleteAllRecoveryCodes(user.$id);
        }

        // Audit Log
        await logOrgAudit({
            databases,
            organizationId: (user.prefs?.primaryOrganizationId as string) || user.$id,
            actorUserId: user.$id,
            actionType: "two_factor_disabled" as OrgAuditAction,
            metadata: { method, ip: (c.req.header("x-forwarded-for") || "unknown") },
        });

        return c.json({ success: true });
    })
    .post("/recovery-codes", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");

        // Requires recent auth check ideally

        const recoveryCodes = generateCodesLogic();
        const hashes = recoveryCodes.map(hashValue);

        const repository = new TwoFactorRepository(databases);
        await repository.deleteAllRecoveryCodes(user.$id);
        await repository.createRecoveryCodes(user.$id, hashes);

        return c.json({ data: { recoveryCodes } });
    })
    .post("/verify", zValidator("json", verify2FASchema), async (c) => {
        const { code, tempToken, method, isRecoveryCode } = c.req.valid("json");
        const { databases, users } = await createAdminClient();
        const { DATABASE_ID, LOGIN_TOKENS_ID } = await import("@/config");
        const crypto = await import("crypto");

        if (!LOGIN_TOKENS_ID) {
            return c.json({ error: "Service unavailable" }, 500);
        }

        const tokenHash = crypto.createHash("sha256").update(tempToken).digest("hex");

        // 1. Find the challenge token
        const tokens = await databases.listDocuments(DATABASE_ID, LOGIN_TOKENS_ID, [
            Query.equal("tokenHash", tokenHash),
            Query.equal("purpose", "2FA_CHALLENGE"),
        ]);

        if (tokens.total === 0) {
            return c.json({ error: "Invalid or expired session" }, 401);
        }

        const loginToken = tokens.documents[0];
        if (new Date(loginToken.expiresAt) < new Date() || loginToken.usedAt) {
            return c.json({ error: "Session expired" }, 401);
        }

        const userId = loginToken.userId;

        // 2. Fetch user to verify 2FA method
        const user = await users.get(userId);
        const prefs = user.prefs as Record<string, unknown>;

        if (!prefs?.twoFactorEnabled) {
            return c.json({ error: "2FA not enabled for this account" }, 400);
        }

        let verified = false;

        // 3. Handle Recovery Code
        if (isRecoveryCode) {
            const repository = new TwoFactorRepository(databases);
            const codeHash = hashValue(code);
            const recoveryCode = await repository.getValidRecoveryCode(userId, codeHash);

            if (recoveryCode) {
                await repository.markRecoveryCodeUsed(recoveryCode.$id);
                verified = true;

                await logOrgAudit({
                    databases,
                    organizationId: (prefs.primaryOrganizationId as string) || userId,
                    actorUserId: userId,
                    actionType: "recovery_code_used" as OrgAuditAction,
                    metadata: { ip: (c.req.header("x-forwarded-for") || "unknown") },
                });
            }
        }
        // 4. Handle specific verification method
        else if (method === TwoFactorMethod.TOTP) {
            if (prefs.totpSecret) {
                verified = verifyTotpLogic(code, prefs.totpSecret as string);
            }
        }
        else if (method === TwoFactorMethod.EMAIL) {
            try {
                verified = await verifyEmailOtpLogic(databases, userId, code);
            } catch (error) {
                return c.json({ error: (error as Error).message }, 400);
            }
        }
        // 5. Default fallbacks if method is missing (backward compatibility)
        else if (prefs.twoFactorMethod === TwoFactorMethod.TOTP || prefs.twoFactorMethod === TwoFactorMethod.BOTH) {
            if (prefs.totpSecret) {
                verified = verifyTotpLogic(code, prefs.totpSecret as string);
            }
        }
        else if (prefs.twoFactorMethod === TwoFactorMethod.EMAIL) {
            try {
                verified = await verifyEmailOtpLogic(databases, userId, code);
            } catch (error) {
                return c.json({ error: (error as Error).message }, 400);
            }
        }

        if (!verified) {
            await logOrgAudit({
                databases,
                organizationId: (prefs.primaryOrganizationId as string) || userId,
                actorUserId: userId,
                actionType: "two_factor_failed" as OrgAuditAction,
                metadata: { ip: (c.req.header("x-forwarded-for") || "unknown") },
            });
            return c.json({ error: "Invalid verification code" }, 401);
        }

        // 6. Verification Success - Create Session
        // Since we stored the original session secret, we COULD try to use it if we didn't delete the session.
        // But we DID delete it in login route for security.
        // So we create a NEW one.
        const session = await users.createSession(userId);

        // Mark token as used
        await databases.updateDocument(DATABASE_ID, LOGIN_TOKENS_ID, loginToken.$id, {
            usedAt: new Date().toISOString(),
        });

        // Set Auth Cookie
        setCookie(c, AUTH_COOKIE, session.secret, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
        });

        await logOrgAudit({
            databases,
            organizationId: (prefs.primaryOrganizationId as string) || userId,
            actorUserId: userId,
            actionType: "two_factor_verified" as OrgAuditAction,
            metadata: { ip: (c.req.header("x-forwarded-for") || "unknown") },
        });

        return c.json({ success: true });
    });

export default app;
